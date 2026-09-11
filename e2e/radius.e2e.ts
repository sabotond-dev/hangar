// THE NO-RADIUS GATE, LAYER C: THE COMPUTED-STYLE SWEEP (plan 13-01, D-01,
// D-10, D-15).
//
// ONE @webkit TITLE, SO IT RUNS IN BOTH PROJECTS. playwright.config.ts gives
// chromium no grep and webkit-phone `grep: /@webkit/`, so a tagged title runs
// twice and counts twice: this file is +1 to the source title count and +2
// to the run. That arithmetic is stated here because it is the only place in
// Phase 13 where one title is two runs by design rather than by accident
// (e2e/browse-webkit.e2e.ts wrote the rule out first - and also warned that
// quoting the title-counting grep pattern in a comment adds a phantom match
// to the file's own count, which this header did on its first cut).
//
// WHAT ONLY A BROWSER CAN SEE. src/lib/ui/radius.spec.ts reads the source
// (layer A) and the built stylesheet (layer B). Neither can see the
// user-agent stylesheet: WebKit draws <input type="search">, <select> and
// their kin with a 5px radius of their own (measured below), and the site has
// a real search field on /playground/. And neither can measure a box: D-10 permits the
// literal 50% on a TRUE CIRCLE and forbids it on a rounded rectangle, and
// "a 50% radius on a non-square element is a pill wearing a circle's clothes"
// is a statement about width and height, which only getBoundingClientRect
// knows. So on every route the site serves - the three real pages (the
// workspace with its panel OPENED, so all six of D-15's circles are in the
// DOM and each is measured) and every probe page under /dev/, discovered from
// src/routes/dev/ so a new one is swept without anyone editing this file -
// every element and every generated ::before / ::after is read:
//
// WHAT THE FIRST RUN FOUND, 2026-09-11, measured in bare documents with no
// author stylesheet. Chromium's user-agent stylesheet gives no element a
// radius. WebKit's - desktop and the iPhone 15 emulation alike - gives
// input[type=search], input[type=text], input[type=number], <textarea> and
// <select> 5px on all four corners, as part of the NATIVE CONTROL APPEARANCE:
// on the inputs and the textarea it disappears the moment an author sets a
// border, a background-color or appearance: none; on <select> it survives all
// three and only an explicit border-radius: 0 removes it. The site showed
// none of it because Tailwind v4's preflight, imported at the top of
// src/app.css, already carries `button, input, select, optgroup, textarea {
// background-color: transparent; border-radius: 0 }` - that one author rule
// is the reset the plan expected to have to write, and no element needed
// another. It is load-bearing for 13-08's sort <select>: with preflight's
// rule deleted at run time, a bare <select> on any route is red in the webkit
// project as "5px from no author rule" (negative check 3 in 13-01-SUMMARY.md).
//
//   - a percentage radius must be exactly 50%, and its box must be square
//     within one device pixel;
//   - a non-zero length is a failure UNLESS the allowlist is still non-empty
//     AND an author rule (a stylesheet rule or an inline style) set it AND
//     the value is one an allowlisted source file declares today. A radius
//     that no author rule matches is a UA default, and it is red whatever its
//     value. When the allowlist is empty (13-20) every non-zero length is red.
//
// The tolerance is the same one layer A carries - the declared, shrinking
// allowlist - read from the same module, so this title is green on the tree
// as it stands and turns strict on the day the last row goes. It is NOT a
// second permission: a value that layer A would reject is rejected here too.
//
// THE MESSAGE NAMES THE ELEMENT: route, tag, id, classes, data-testid, the
// pseudo-element if any, and the four computed corners.
//
// Everything runs against build/ served by worker/index.js under wrangler
// dev; do not commit while it runs (e2e/artifacts.e2e.ts reads HEAD).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ROUTED } from "../src/lib/catalog/listing";
import {
  ALLOWLIST,
  CIRCLES,
  allowlistedValues,
  scanSource,
} from "../src/lib/ui/radius-allowlist";

/** trailingSlash: "always" (src/routes/+layout.ts). Never without the slash. */
const DEV_ROUTES = readdirSync("src/routes/dev")
  .sort()
  .map((name) => `/dev/${name}/`);

/**
 * Two workspace routes, because no one entry mounts all six of D-15's
 * circles. The picker's rails - its tick, thumb and home (ColourPicker.svelte
 * :829, :857, :872) - exist only for a LATTICE colour knob (4,096 values,
 * which 10-08 gave the vendored presets; every Lua entry's colour knob is a
 * hand-authored palette and mounts a swatch Knob instead), so AURORA carries
 * them. Knob's slider thumb needs a knob with nine or more values, so ARC's
 * 16-value amount knob carries it; its dot rail and home mark
 * are on every rack. Since 13-09 a /playground/<id>/ is the workspace with its
 * inspector on the page, and the picker's three live in a popover behind the
 * swatch's Edit color, which this sweep opens before it measures - so all six
 * are in the DOM when they are measured (D-15 lines: Knob :730 / :785 / :807).
 * Zero circles measured would be a vacuous square arm, and it was, on this
 * title's first run.
 */
const WORKSPACE_ENTRIES = ["aurora", "arc"];
const WORKSPACES = WORKSPACE_ENTRIES.map((id) => `/playground/${id}/`);

const ROUTES = ["/", "/playground/", ...WORKSPACES, ...DEV_ROUTES];

/** The six, as the sweep labels them: the owning control and the class. */
const SIX_CIRCLES = [
  "knob:dot",
  "knob:thumb",
  "knob:home",
  "picker:tick",
  "picker:thumb",
  "picker:home",
];

/** Strict once the allowlist is empty; tolerant of exactly its values until then. */
const STRICT = ALLOWLIST.length === 0;
const TOLERATED = allowlistedValues(scanSource().declarations);

interface Sweep {
  elements: number;
  pseudos: number;
  authorRules: number;
  circlesMeasured: number;
  /** `knob:dot`, `picker:thumb`, ... - one per 50% element with a box. */
  circleLabels: string[];
  findings: string[];
}

/** Runs inside the page. Serialisable, so no closure over module state. */
function sweep(args: { strict: boolean; tolerated: string[] }): Sweep {
  const CORNERS = [
    "border-top-left-radius",
    "border-top-right-radius",
    "border-bottom-right-radius",
    "border-bottom-left-radius",
  ];

  // Every author rule that sets a radius, split per selector and per
  // pseudo-element, collected once. Same-origin stylesheets only exist here.
  const rules: { base: string; pseudo: string | null }[] = [];
  const walk = (list: CSSRuleList) => {
    for (const rule of Array.from(list)) {
      const grouped = rule as CSSGroupingRule;
      if (grouped.cssRules && grouped.cssRules.length) walk(grouped.cssRules);
      const styled = rule as CSSStyleRule;
      if (!styled.style || !styled.selectorText) continue;
      if (!CORNERS.some((p) => styled.style.getPropertyValue(p) !== "")) {
        continue;
      }
      for (const part of styled.selectorText.split(",")) {
        const m = /^(.*?)(?:::?(before|after))?$/.exec(part.trim());
        rules.push({ base: (m && m[1]) || "*", pseudo: (m && m[2]) || null });
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch {
      // A cross-origin sheet would be unreadable; the site ships none.
    }
  }

  const authored = (el: Element, pseudo: string | null): boolean => {
    const inline = (el as HTMLElement).style;
    if (!pseudo && inline && CORNERS.some((p) => inline.getPropertyValue(p))) {
      return true;
    }
    for (const rule of rules) {
      if (rule.pseudo !== pseudo) continue;
      try {
        if (el.matches(rule.base)) return true;
      } catch {
        // A selector the engine cannot match against an element.
      }
    }
    return false;
  };

  const describe = (el: Element, pseudo: string | null): string => {
    const cls =
      typeof el.className === "string" && el.className.trim()
        ? "." + el.className.trim().split(/\s+/).join(".")
        : "";
    const id = el.id ? "#" + el.id : "";
    const testid = (el as HTMLElement).dataset?.testid;
    return `<${el.tagName.toLowerCase()}${id}${cls}${testid ? ` data-testid="${testid}"` : ""}>${pseudo ? "::" + pseudo : ""}`;
  };

  const out: Sweep = {
    elements: 0,
    pseudos: 0,
    authorRules: rules.length,
    circlesMeasured: 0,
    circleLabels: [],
    findings: [],
  };

  /** Which control owns a circle, and which of its classes drew it. */
  const label = (el: Element): string => {
    // Innermost owner wins: a palette Knob mounted INSIDE the picker (a
    // hand-authored colour list rather than the lattice) is still a Knob.
    const knob = el.closest('[data-testid^="knob-"]');
    const picker = el.closest('[data-testid="colour-picker"]');
    const owner =
      knob && picker
        ? picker.contains(knob)
          ? "knob"
          : "picker"
        : knob
          ? "knob"
          : picker
            ? "picker"
            : "other";
    const first =
      typeof el.className === "string"
        ? el.className.trim().split(/\s+/)[0] || el.tagName.toLowerCase()
        : el.tagName.toLowerCase();
    return `${owner}:${first}`;
  };

  const check = (el: Element, pseudo: string | null) => {
    const cs = getComputedStyle(el, pseudo ? "::" + pseudo : null);
    if (pseudo && (cs.content === "none" || cs.content === "normal")) return;
    if (pseudo) out.pseudos += 1;
    else out.elements += 1;

    const corners = CORNERS.map((p) => cs.getPropertyValue(p));
    const tokens = corners.flatMap((v) => v.split(/\s+/)).filter(Boolean);
    const nonZero = tokens.filter((t) => parseFloat(t) > 0);
    if (nonZero.length === 0) return;

    const where = describe(el, pseudo);
    const shown = corners.join(" | ");
    const percentages = nonZero.filter((t) => t.endsWith("%"));
    const lengths = nonZero.filter((t) => !t.endsWith("%"));

    if (percentages.length) {
      if (percentages.some((t) => t !== "50%")) {
        out.findings.push(
          `${where} computes a percentage radius that is not 50% (${shown}); only the literal 50% on a square box is permitted (D-10, D-15)`,
        );
      } else {
        let w: number;
        let h: number;
        if (pseudo) {
          w = parseFloat(cs.width);
          h = parseFloat(cs.height);
        } else {
          const rect = el.getBoundingClientRect();
          w = rect.width;
          h = rect.height;
        }
        if (w > 0 || h > 0) {
          out.circlesMeasured += 1;
          if (!pseudo) out.circleLabels.push(label(el));
        }
        if (Math.abs(w - h) * devicePixelRatio > 1) {
          out.findings.push(
            `${where} carries border-radius 50% on a ${w}x${h} box: a 50% radius on a non-square element is a pill wearing a circle's clothes (D-10)`,
          );
        }
      }
    }

    if (lengths.length) {
      if (args.strict) {
        out.findings.push(
          `${where} computes border-radius ${shown} and the allowlist is empty: never a rounded corner (D-01)`,
        );
      } else if (!authored(el, pseudo)) {
        out.findings.push(
          `${where} computes border-radius ${shown} from no author rule: a user-agent default no source scan can see. Reset it with border-radius: 0 in src/app.css`,
        );
      } else {
        const unknown = lengths.filter((t) => !args.tolerated.includes(t));
        if (unknown.length) {
          out.findings.push(
            `${where} computes border-radius ${shown}, and ${unknown.join(", ")} is a value no allowlisted source file declares (D-01)`,
          );
        }
      }
    }
  };

  for (const el of Array.from(document.querySelectorAll("*"))) {
    check(el, null);
    check(el, "before");
    check(el, "after");
  }
  return out;
}

/** Let fonts and the first frames land before the boxes are measured. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const done = () =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(done, done);
        } else done();
      }),
  );
}

test("no element on any route computes a corner radius above zero, and every 50% sits on a square box @webkit", async ({
  page,
}) => {
  // Non-vacuous: the dev pages are discovered, not typed, and there are seven.
  expect(DEV_ROUTES.length, "probe pages under /dev/").toBeGreaterThanOrEqual(
    7,
  );
  expect(CIRCLES.length, "D-15 names six").toBe(6);
  for (const id of WORKSPACE_ENTRIES) {
    expect(
      ROUTED.some((entry) => entry.id === id),
      `${id} is a routed entry`,
    ).toBe(true);
  }

  const findings: string[] = [];
  const tallies: string[] = [];
  const measuredKinds = new Set<string>();
  let elements = 0;
  let circlesMeasured = 0;

  for (const route of ROUTES) {
    await page.goto(route);
    if (WORKSPACES.includes(route)) {
      // The same arrival e2e/tuning.e2e.ts waits for: the workspace up and
      // the entry's pad painted. Since 13-09 nothing is chosen - the panel
      // and the inspector are on the page - and the circles live in the
      // inspector's racks and in the colour popover, which is opened so its
      // three are measured too.
      const id = WORKSPACE_ENTRIES[WORKSPACES.indexOf(route)];
      await expect(page.getByTestId("workspace")).toBeVisible();
      await page.waitForFunction(
        (sel) => {
          const c = document.querySelector(sel) as HTMLCanvasElement | null;
          const ctx = c && c.getContext("2d");
          return (
            !!ctx && ctx.getImageData(0, 0, 9, 9).data.some((b) => b !== 0)
          );
        },
        `[data-testid="pad-canvas-${id}"]`,
        { timeout: 30_000 },
      );
      await expect(page.getByTestId("chosen-panel")).toBeVisible();
      const inspector = page.getByTestId("shell-inspector");
      await expect(inspector.getByTestId("knob-rack").first()).toBeVisible();
      // THE VIEW MUST HAVE LANDED BEFORE THE SWATCH IS LOOKED FOR. The
      // Behavior rack renders (with its empty line) before the tuner's first
      // view arrives, and the Appearance section - the swatch and its
      // popover - exists only once it has; a count of Edit color taken at
      // "first rack visible" read zero once under three workers and skipped
      // the click, and the closed popover's thumb then read hidden
      // (2026-09-11, both engines). So a knob ROW is waited for first, and
      // the popover is opened and its open attribute waited for.
      await expect(
        inspector
          .locator('[data-testid^="knob-"]:not([data-testid="knob-rack"])')
          .first(),
      ).toBeVisible();
      const editColor = inspector.getByTestId("edit-color");
      if ((await editColor.count()) > 0) {
        await editColor.first().click();
        await expect(page.getByTestId("colour-popover")).toHaveAttribute(
          "open",
          "",
        );
      }
      // The precondition is the circles themselves, not the rack: a sweep
      // that runs before the last rail mounts measures fewer than it should
      // (observed once in chromium, the 16-value knob's thumb missing).
      await expect(page.locator(".thumb").first()).toBeVisible();
      await expect(inspector.locator(".dot").first()).toBeVisible();
      await expect(inspector.locator(".home").first()).toBeAttached();
    }
    await settle(page);
    const result = await page.evaluate(sweep, {
      strict: STRICT,
      tolerated: TOLERATED,
    });
    // A route that yields almost nothing was not rendered; say so rather
    // than pass on an empty document.
    expect(result.elements, `${route} rendered`).toBeGreaterThan(20);
    elements += result.elements;
    circlesMeasured += result.circlesMeasured;
    const kinds = [...new Set(result.circleLabels)].sort();
    for (const kind of kinds) measuredKinds.add(kind);
    tallies.push(
      `${route} ${result.elements} elements, ${result.pseudos} pseudo-elements, ${result.authorRules} author radius rules, ${result.circlesMeasured} circles measured${kinds.length ? ` (${kinds.join(", ")})` : ""}`,
    );
    findings.push(...result.findings.map((f) => `${route} ${f}`));
  }

  // D-10's square arm is only a check if the six are on screen: every one
  // of D-15's circle kinds must have been measured on some route.
  expect(
    SIX_CIRCLES.filter((kind) => !measuredKinds.has(kind)),
    `D-15 circle kinds NOT measured on any route (measured: ${[...measuredKinds].sort().join(", ") || "none"}) - the square arm would be vacuous`,
  ).toEqual([]);

  console.log(
    `radius layer C: ${ROUTES.length} routes, ${elements} elements, ${circlesMeasured} circles measured square; ` +
      `${STRICT ? "STRICT (the allowlist is empty)" : `tolerating ${TOLERATED.join(", ")} from ${ALLOWLIST.length} allowlisted files`}\n` +
      tallies.join("\n"),
  );

  expect(
    findings,
    "a computed corner radius above zero. D-01: never a rounded corner. Each line names the route, the element and its four corners",
  ).toEqual([]);
});
