// The shape gate on docs/HARDWARE-AUDITION.md, and the writer that produces the
// exact pasteable bytes the audition is run from.
//
// A checklist rots. docs/PIN-POLICY.md set this repository's precedent: an item
// that names a command and its expected count stops being runnable the moment it
// stops being true, which is exactly why it is written that way and exactly why
// something has to hold it to the code. The same applies here. The audition
// document names configurations, an install order and twelve rows; each of those
// is a claim about the catalog, and each can silently stop being true.
//
// The four tests below check STRUCTURE and AGREEMENT WITH THE DATA, never
// wording - src/lib/skeleton-results.spec.ts's rule, for the same reason: a gate
// that fails on an honest edit is a gate that gets deleted. The one exception is
// the install-order rule, which IS its words: "Timer into event 6 first" is not
// a structural property, it is the sentence that decides whether the pad moves
// at all. Test 4 matches it loosely enough to survive a rewrite and tightly
// enough to fail if the order flips, and takes both event numbers from
// ./types.ts rather than from literals here.
//
// THE DUMP:
//   AUDITION_DUMP=1 npx vitest run --project server src/lib/catalog/audition.spec.ts
// writes .tmp-audition/<id>.setup.lua and .tmp-audition/<id>.timer.lua for every
// hand-authored entry, rendered at its defaults, and prints each character count
// against EVENT_BUDGET.
//
// Unlike UPDATE_GOLDEN (src/lib/fidelity/golden-frames.spec.ts) and
// UPDATE_SYNTHETIC (src/lib/transport/fixtures/synthetic.spec.ts), this writer
// DOES NOT FAIL THE RUN, and that divergence is a decision rather than an
// oversight. Those two rewrite a COMMITTED fixture, where a regeneration
// mistaken for a passing run is a real hazard - the run would be checking the
// output against itself. This one writes to a gitignored scratch directory and
// commits nothing, so there is nothing for a green run to be wrong about; and
// the user runs it at a bench, where a red run for a reason that is not a
// failure is its own kind of harm.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
import { renderLua } from "../sim/lua-pad-sim";
import { CATALOG, EVENT_SETUP, EVENT_TIMER, type CatalogEntry } from "./index";

const DOC_REL = "docs/HARDWARE-AUDITION.md";
const DOC_URL = new URL(`../../../${DOC_REL}`, import.meta.url);
const doc = readFileSync(DOC_URL, "utf8");

/** The document with every run of whitespace collapsed, for prose matching. */
const flat = doc.replace(/\s+/g, " ");

/** The number of rows the checklist has, and must keep having. */
const ROW_COUNT = 30;

/** CONT-02's floor: at least six hand-authored configurations. */
const LUA_FLOOR = 6;

/** The one name the document must mention and the catalog must NOT hold. */
const BLOCKED = "MIRROR";

/** The shortest a stated reason may be before it reads as a placeholder. */
const MIN_REASON = 20;

interface Row {
  index: number;
  config: string;
  check: string;
  reason: string;
}

/** The `## The checklist` section, or "" if the document lost it. */
function checklistSection(): string {
  for (const part of doc.split(/^## /m).slice(1)) {
    if (part.startsWith("The checklist")) return part;
  }
  return "";
}

const SECTION = checklistSection();

/**
 * Whether the section holds a table with the columns the checklist is.
 *
 * Asserted BEFORE any row assertion. A document that lost its table parses to
 * zero rows, and "zero rows" must fail loudly rather than satisfy a weaker
 * shape check by vacuum.
 */
function hasHeader(): boolean {
  return /\|\s*#\s*\|\s*Config\s*\|\s*What to check\s*\|/.test(SECTION);
}

/** Every numbered data row of the checklist table, in document order. */
function rows(): Row[] {
  const out: Row[] = [];
  for (const line of SECTION.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) continue;
    const cells = trimmed
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    if (cells.length !== 4) continue;
    if (!/^[0-9]+$/.test(cells[0])) continue;
    out.push({
      index: Number.parseInt(cells[0], 10),
      config: cells[1],
      check: cells[2],
      reason: cells[3],
    });
  }
  return out;
}

const ROWS = rows();

/**
 * The configuration names a Config cell claims.
 *
 * Split on "/" for the two shared rows, then take the leading upper-case run of
 * each part - which drops the lower-case `any` and survives a parenthetical
 * such as "MIRROR (optional)" without this function needing to know about it.
 */
function namesIn(config: string): string[] {
  return config
    .split("/")
    .map((part) => /[A-Z][A-Z0-9]*/.exec(part.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => match[0]);
}

/** Every name the checklist claims, deduplicated, in document order. */
const CLAIMED = [...new Set(ROWS.flatMap((row) => namesIn(row.config)))];

/** The hand-authored entries. Empty is a failure, asserted in tests 2 and 3. */
function luaEntries(): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.source.kind === "lua");
}

/** One entry's Timer text, as stored. "" is MORPH's, and is legitimate. */
function timerOf(entry: CatalogEntry): string {
  const source = entry.source;
  if (source.kind !== "lua") throw new Error(`${entry.id}: not a lua entry`);
  return source.timer;
}

/**
 * One line to the real stdout.
 *
 * Not console.log: the dump runs at module scope, during collection, and
 * Vitest's console interception swallows anything logged there - measured, the
 * lines simply never appeared. The whole point of these lines is that the user
 * at a bench sees each character count beside the budget, so they go to the
 * stream directly.
 */
function write(line: string): void {
  process.stdout.write(`${line}\n`);
}

/**
 * Write every configuration's exact pasteable text to .tmp-audition/.
 *
 * The bytes come from renderLua, the same function the simulator and the budget
 * gate call, so the document, the pad and the tests cannot receive three
 * different strings. Nothing is written with a trailing newline: what goes into
 * the event is the configuration and not one character more.
 */
function dumpAudition(): void {
  const dir = fileURLToPath(
    new URL("../../../.tmp-audition/", import.meta.url),
  );
  mkdirSync(dir, { recursive: true });
  write(`AUDITION_DUMP -> ${dir}`);
  for (const entry of luaEntries()) {
    const { setup, timer } = renderLua(entry);
    writeFileSync(`${dir}${entry.id}.setup.lua`, setup, "utf8");
    if (timer !== "") {
      writeFileSync(`${dir}${entry.id}.timer.lua`, timer, "utf8");
    }
    const timerNote =
      timer === "" ? "no Timer" : `timer ${timer.length}/${EVENT_BUDGET}`;
    write(`  ${entry.id}: setup ${setup.length}/${EVENT_BUDGET}, ${timerNote}`);
  }
}

if ((process.env.AUDITION_DUMP ?? "") !== "") dumpAudition();

describe(`${DOC_REL} (D-16, the hardware audition)`, () => {
  it("keeps thirty numbered rows, each with a reason it cannot be simulated", () => {
    expect(
      SECTION.length,
      "no `## The checklist` section - the document lost the checklist entirely",
    ).toBeGreaterThan(0);
    expect(
      hasHeader(),
      "the checklist section holds no four-column table; a parse of zero rows " +
        "must never be able to satisfy the shape assertions below",
    ).toBe(true);

    expect(ROWS.length, "checklist rows").toBe(ROW_COUNT);
    expect(
      ROWS.map((row) => row.index),
      "the rows are numbered 1 to 30, in order",
    ).toEqual(Array.from({ length: ROW_COUNT }, (_, i) => i + 1));

    for (const row of ROWS) {
      expect(
        row.check.length,
        `row ${row.index} says nothing to check`,
      ).toBeGreaterThan(MIN_REASON);
      // The load-bearing one. A row with no stated reason it cannot be
      // simulated is busywork at a bench, and this is the assertion that keeps
      // it out of the document.
      expect(
        row.reason.length,
        `row ${row.index} (${row.config}) states no reason it cannot be ` +
          "simulated - a row without one is busywork",
      ).toBeGreaterThan(MIN_REASON);
    }
  });

  it("names only real configurations, and MIRROR only as an optional row", () => {
    const live = new Set(CATALOG.map((entry) => entry.name));
    expect(
      CLAIMED.length,
      "the checklist names no configuration at all",
    ).toBeGreaterThan(0);

    for (const name of CLAIMED) {
      if (name === BLOCKED) continue;
      expect(
        live.has(name),
        `the checklist names ${name}, which no live CATALOG entry claims - ` +
          "either the configuration was renamed or the document is stale",
      ).toBe(true);
    }

    // The double condition. MIRROR is blocked (D-04) on one hardware answer, so
    // it must be IN the document - as an optional row that ships nothing - and
    // OUT of the catalog. Either half alone would let it be quietly shipped or
    // quietly forgotten.
    expect(
      CLAIMED,
      `${BLOCKED} is blocked on the audition's own row 11; dropping it from ` +
        "the checklist would lose the only thing that can unblock it",
    ).toContain(BLOCKED);
    expect(
      live.has(BLOCKED),
      `${BLOCKED} is in CATALOG but is blocked (D-04) until inbound host MIDI ` +
        "is proven to reach midirx_cb on real hardware",
    ).toBe(false);
    const mirrorRows = ROWS.filter((row) =>
      namesIn(row.config).includes(BLOCKED),
    );
    expect(mirrorRows, `no row names ${BLOCKED}`).toHaveLength(1);
    expect(
      `${mirrorRows[0].config} ${mirrorRows[0].check}`.toLowerCase(),
      `the ${BLOCKED} row must say it is optional - it ships nothing today`,
    ).toContain("optional");
  });

  it("auditions every shipped hand-authored configuration", () => {
    const entries = luaEntries();
    // Asserted first: an empty catalog would otherwise satisfy the loop below
    // vacuously, and CONT-02's floor is six.
    expect(
      entries.length,
      "hand-authored entries in CATALOG (CONT-02 floor)",
    ).toBeGreaterThanOrEqual(LUA_FLOOR);

    for (const entry of entries) {
      expect(
        CLAIMED,
        `${entry.name} (${entry.id}) ships in the catalog but no checklist ` +
          "row auditions it",
      ).toContain(entry.name);
    }
  });

  it("keeps the install-order rule, its reason and MORPH's exemption", () => {
    // Both numbers come from ./types.ts, so a future event renumbering moves
    // this assertion with the code instead of leaving a document that names
    // the old events and a spec that agrees with it.
    const order = new RegExp(
      `Timer[^.]{0,60}event ${EVENT_TIMER}[^.]{0,60}Setup[^.]{0,60}event ` +
        `${EVENT_SETUP}`,
    );
    expect(
      flat,
      `the document must state that the Timer goes into event ${EVENT_TIMER} ` +
        `FIRST and the Setup into event ${EVENT_SETUP} second - the reverse ` +
        "order arms a timer that does not exist yet and the pad sits still",
    ).toMatch(order);

    // The reason, not just the rule: a rule with no reason gets "corrected".
    expect(flat, "the gtt reason for the install order").toMatch(
      /gtt[^.]{0,120}no-op/,
    );

    // MORPH is the exception, and the document and the data must agree on it.
    expect(flat, "MORPH is described as Setup only").toMatch(
      /MORPH[^.]{0,200}Setup only/,
    );
    const morph = CATALOG.find((entry) => entry.name === "MORPH");
    expect(morph, "MORPH is in the catalog").toBeDefined();
    expect(
      timerOf(morph as CatalogEntry),
      "MORPH's stored Timer - the document calls it Setup only, and the entry " +
        "must actually be",
    ).toBe("");
  });
});
