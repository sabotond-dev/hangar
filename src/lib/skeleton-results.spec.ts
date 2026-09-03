import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRE_SEND_DELAY_MS, TIMEOUTS } from "$lib/protocol";

// The structural gate on docs/SKELETON-RESULTS.md (FOUND-01 criterion 5, D-08).
//
// The results document is the whole reason the walking skeleton exists: six
// questions written down before the run so the answers could not be chosen
// after it, each answer citing the capture it came from. A prose document rots
// silently - an answer loses its citation in an edit, a fixture is renamed, a
// section quietly becomes a placeholder - and none of that fails a build.
//
// This spec is the smallest set of assertions that make those failures loud.
// It deliberately checks STRUCTURE and CITATION, never wording: matching on
// phrasing would make every honest edit of the document a test failure, which
// is how a gate gets deleted.
//
// The same idea as src/lib/licence-notices.spec.ts (a document that must stay
// complete) and src/lib/protocol-pin.spec.ts (a constant bound to the document
// that justifies it).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

const root = (file: string) => new URL(`../../${file}`, import.meta.url);
const DOC_PATH = "docs/SKELETON-RESULTS.md";
const doc = readFileSync(root(DOC_PATH), "utf8");

const QUESTIONS = ["a", "b", "c", "d", "e", "f"] as const;
type Question = (typeof QUESTIONS)[number];

/**
 * Split the document at its level-2 headings and keep the six answer sections.
 *
 * Scoping matters for tests 3 and 4: "What was run" names the superseded
 * mid-run export that is deliberately NOT committed, and "Open, still" names
 * files for context. A document-wide sweep for citations would turn that prose
 * into a gate and push the next author towards writing less of it.
 */
function answerSections(): Map<Question, string> {
  const sections = new Map<Question, string>();
  const parts = doc.split(/^## /m).slice(1);
  for (const part of parts) {
    const match = /^\(([a-f])\)/.exec(part);
    if (match) sections.set(match[1] as Question, part);
  }
  return sections;
}

const SECTIONS = answerSections();

/** Every `something.json` named in the six answer sections. */
const citedFixtures = (text: string): string[] => [
  ...new Set(text.match(/[A-Za-z0-9._-]+\.json/g) ?? []),
];

describe("docs/SKELETON-RESULTS.md (FOUND-01 criterion 5)", () => {
  it("the results document answers all six questions under their own headings", () => {
    for (const q of QUESTIONS) {
      expect(
        doc,
        `no "## (${q})" heading - question ${q} has no section of its own`,
      ).toMatch(new RegExp(`^## \\(${q}\\) `, "m"));
      const section = SECTIONS.get(q);
      expect(section, `section (${q}) was not parsed`).toBeDefined();
      // A heading with nothing under it is not an answer.
      expect(
        (section ?? "").trim().length,
        `section (${q}) is a heading with no answer under it`,
      ).toBeGreaterThan(200);
    }
    expect(SECTIONS.size, "exactly the six questions D-08 asked").toBe(6);
  });

  it("no answer is left as TBD", () => {
    // Substring, case-insensitive, whole document - the same check as
    // `grep -ci "tbd" docs/SKELETON-RESULTS.md` returning 0. The standing rule
    // for this document is that an unsettled question is written out as what
    // was observed and what is still open, never as a placeholder.
    expect(doc, "a placeholder is not an answer").not.toMatch(/tbd/i);
  });

  it("every answer cites its evidence", () => {
    // (a) through (e) were measured by this run, so each cites a capture.
    for (const q of ["a", "b", "c", "d", "e"] as const) {
      const section = SECTIONS.get(q) ?? "";
      expect(
        citedFixtures(section),
        `section (${q}) cites no capture - every measured claim names the ` +
          "fixture it came from",
      ).not.toHaveLength(0);
    }
    // (f) is exempt and has its own rule. It was answered by Phase 3, in a real
    // browser against the real production build, and the skeleton never loads
    // the formatter at all - so no capture from this run could evidence it
    // either way, and a rule forcing a fixture citation here would only produce
    // a decorative one.
    const f = SECTIONS.get("f") ?? "";
    expect(
      f,
      "section (f) must cite the phase that actually measured it",
    ).toContain("03-06-SUMMARY.md");
    expect(
      citedFixtures(f),
      "and must not invent a capture to look like the others",
    ).toEqual([]);
  });

  it("every cited fixture exists on disk", () => {
    const cited = new Set<string>();
    for (const section of SECTIONS.values()) {
      for (const file of citedFixtures(section)) cited.add(file);
    }
    expect(cited.size, "the answers cite captures at all").toBeGreaterThan(0);
    for (const file of cited) {
      expect(
        existsSync(root(`src/lib/transport/fixtures/${file}`)),
        `${DOC_PATH} cites src/lib/transport/fixtures/${file}, which does not ` +
          "exist",
      ).toBe(true);
    }
  });

  it("the measured latencies and the shipped timeouts are both stated", () => {
    const c = SECTIONS.get("c") ?? "";
    // The desktop's three, for comparison. Shipping a number without saying
    // what it replaced hides whether anything was learned.
    for (const desktop of ["250", "500", "3000"]) {
      expect(c, `section (c) omits the desktop's ${desktop} ms`).toContain(
        desktop,
      );
    }
    const measured = c.match(/\d+(\.\d+)? ms/g) ?? [];
    expect(
      measured.length,
      "section (c) states no measured latencies",
    ).toBeGreaterThanOrEqual(3);
  });

  it("the store caveat and the page-change restore rule are both recorded", () => {
    // Phase 7 reads this document before it designs KEEP ON DEVICE. Both of
    // these are things it would otherwise discover on a user's hardware.
    expect(doc, "the store's script restart is not recorded").toMatch(
      /restart/i,
    );
    const paragraphs = doc.split(/\n\s*\n/);
    expect(
      paragraphs.filter((p) => /restart/i.test(p) && /script|lua/i.test(p)),
      "no paragraph explains that the store restarts the module's script",
    ).not.toHaveLength(0);
    expect(
      paragraphs.filter((p) => p.includes("255") && /restore/i.test(p)),
      "TYPE 255 is the only thing that re-enables page changing, and the " +
        "document must say so beside the restore",
    ).not.toHaveLength(0);
  });

  it("the shipped timeouts are the ones the results document recorded", () => {
    // A document that records a measurement and a constant that ships a
    // different number is the quiet failure this gate exists to catch: both
    // halves stay individually plausible and nobody has any reason to open the
    // other one. src/lib/protocol-pin.spec.ts is the same idea applied to the
    // package version, and src/lib/fidelity/vendored-diff.spec.ts to the
    // vendored bytes.
    //
    // The document carries one machine-readable line so this test parses a
    // statement rather than prose:
    //   Shipped: fetchMs=..., executeMs=..., pagestoreMs=..., preSendDelayMs=...
    const line =
      /^\s*`?Shipped: fetchMs=(\d+), executeMs=(\d+), pagestoreMs=(\d+), preSendDelayMs=(\d+)`?\s*$/m.exec(
        doc,
      );
    expect(
      line,
      `${DOC_PATH} has no machine-readable "Shipped:" line - section (c) must ` +
        "state the values it concluded in one parseable statement",
    ).not.toBeNull();
    if (!line) return;

    const [, fetchMs, executeMs, pagestoreMs, preSendDelayMs] =
      line.map(Number);
    expect(TIMEOUTS.fetchMs, "fetchMs").toBe(fetchMs);
    expect(TIMEOUTS.executeMs, "executeMs").toBe(executeMs);
    expect(TIMEOUTS.pagestoreMs, "pagestoreMs").toBe(pagestoreMs);
    expect(PRE_SEND_DELAY_MS, "preSendDelayMs").toBe(preSendDelayMs);

    // And the constant points back, so a reader who finds the number first can
    // find the measurement that justifies it.
    const constants = readFileSync(
      root("src/lib/protocol/constants.ts"),
      "utf8",
    );
    expect(
      constants,
      "constants.ts must cite the document that justifies its timeouts",
    ).toContain("SKELETON-RESULTS.md");
  });
});
