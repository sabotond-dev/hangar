// The shape gate on docs/HARDWARE-AUDITION.md, and the writer that produces the exact pasteable
// bytes the audition is run from. A checklist rots (docs/PIN-POLICY.md's precedent): the
// document names configurations, an install order and twelve rows, each a claim about the
// catalog that can silently stop being true. The four tests check STRUCTURE and AGREEMENT WITH
// THE DATA, never wording - except the install-order rule, which IS its words ("Timer into event
// 6 first"); test 4 matches it loosely enough to survive a rewrite, both event numbers from ./types.ts.
//
// THE DUMP: AUDITION_DUMP=1 npx vitest run --project server src/lib/catalog/audition.spec.ts
// writes .tmp-audition/<id>.setup.lua and .timer.lua for every hand-authored entry at its
// defaults and prints each count against EVENT_BUDGET; unlike UPDATE_GOLDEN and UPDATE_SYNTHETIC
// it DOES NOT FAIL THE RUN - it writes to a gitignored scratch directory and commits nothing.
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

/**
 * The number of rows the checklist has, and must keep having.
 *
 * 25 -> 22 at plan 12-04: the LATTICE row, the SHUTTLE row and the FORGE row
 * left with their entries, and the shared CHORUS / LATTICE row kept its
 * surviving name rather than leaving.
 *
 * 22 -> 23 at plan 12-10: TRACKPAD's row. The tpad preset it replaced never
 * had one - the checklist audits hand-authored configurations - so this is an
 * addition and not an amendment.
 *
 * 23 -> 24 at plan 12.1-01: the calibration re-run (row 24, `any`). Probe C
 * measured the sensor-to-LED map once on the user's ZONA; the row asks for
 * the five-minute second reading that docs/CALIBRATION-PROBE.md describes.
 *
 * 24 -> 25 at plan 12.1-03: the gradient row (row 25, EUCLID / STEPS / RADAR
 * POINTS / SONAR) - the first ten minutes of the bench, ten clauses (a)-(j),
 * the last of them the alert layer. Its Config cell is the first to name four
 * entries and the first wider than the column was, so prettier re-padded
 * every row of the table; no row's text moved, and the gate below reads
 * cells trimmed.
 *
 * 25 -> 26 at plan 12.1-04: the other five under the gradient (row 26, CHORUS
 * / MORPH / CONSOLE / LUMEN / TRACKPAD), five clauses (a)-(e), with D-14's
 * question written beside LUMEN (does the raw CC reach 0 and 127 where the
 * user expects) and D-17's beside TRACKPAD (is the flash centred on the
 * finger's row). Five names in the Config cell, wider again than the column,
 * so prettier re-padded every row a second time; no row's text moved.
 *
 * 26 -> 27 at plan 12.1-08a (2026-09-11; 12.1-CONTEXT D-26 item 1): GHOST
 * under the gradient and the calibrated key (row 27, GHOST), four clauses
 * (a)-(d) - the comet's head under the fingertip, the ghost on the LEDs
 * crossed, LED (7,7) recording where the naive divisor erased, and (d) the
 * design question left to the user: should a paused drag keep recording, or
 * should a lost lift end the loop after three seconds (the Q + R + X(s,150)
 * shape, costed at 530 / 417 and not taken). One name in the Config cell, so
 * prettier re-padded row 27 alone; every other line is byte-identical.
 *
 * 27 -> 28 at plan 12.1-08b (2026-09-11; 12.1-CONTEXT D-26 item 2, D-27): the
 * eight preset cards under the gradient (row 28), six clauses (a)-(f) -
 * AURORA's tail, JOYSTICK's dot, NINE PADS' pads at the edges first time,
 * FOUR FADERS' rails with the raw level and the question whether it should
 * become calibrated, PINWHEEL's two colours, DIAL's trail. THE ONE ROW THAT
 * NAMES NO HAND-AUTHORED CONFIGURATION: its Config cell reads "the eight
 * preset cards" in lower case, so `namesIn` claims nothing from it and test
 * 2's live-name gate is untouched; the document's title covers hand-authored
 * configurations, and a dated scope line appended after the table widens it
 * in writing for this row (R-11's rule, widened rather than bent). No
 * re-padding: the cell is narrower than the column; eight lines inserted,
 * every other line byte-identical.
 *
 * 28 -> 29 on 2026-09-17 (BENCH-2026-09-16.txt section 4): TRACKPAD COMET's row
 * (row 29), six clauses (a)-(f) - the head and the trail under a moving
 * finger, both under a still one, the recipe's four gestures as row 23(c),
 * the tail and head knobs, the scroll knob, and a lost lift fading inside
 * the recipe's idle window.
 * One name in the Config cell; the cost table gains its row and a dated
 * paragraph follows row 28's; every other line byte-identical.
 *
 * 29 -> 30 on 2026-09-17 (section 5): the brightness setting's row, on any card
 * and any surface. 30 -> 31 on 2026-09-17 (section 6): ARC as an LFO.
 *
 * 31 -> 32 on 2026-09-18 (BENCH-2026-09-16.txt section 9): MORPH's centre value
 * (row 32, MORPH), six clauses (a)-(f) - the default unchanged, a centre of 64
 * with the corner still full, a centre of 0 with the middle silent and nothing
 * stuck, 96 read for whether it is still a control, the corner tap still one
 * message, and the corner blocks painted at the value SENT. One name in the
 * Config cell, narrower than the column, so nothing was re-padded; MORPH's cost
 * row moves 810 / 5 -> 856 / 6 and a dated paragraph follows row 31's.
 */
const ROW_COUNT = 33;

/** CONT-02's floor: at least six hand-authored configurations. */
const LUA_FLOOR = 6;

/** The one name the document must mention and the catalog must NOT hold. */
const BLOCKED = "Mirror";

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
 * Split on "/" for the two shared rows, then take the leading capitalised run
 * of each part - which drops the lower-case `any` and `the eight preset
 * cards`, and survives a parenthetical such as "Mirror (optional)" without
 * this function needing to know about it.
 *
 * A RUN MAY CONTAIN SINGLE SPACES SINCE PLAN 11-14: Radar points is the first
 * hand-authored entry with a two-word name, and the one-word run claimed it as
 * "Radar", which IS a live entry - the preset - so the gate would have passed
 * a row it could not read. The widening admits `Word word`, still stops at a
 * parenthesis, and claims exactly the same names for every row.
 *
 * SENTENCE CASE SINCE PLAN 13-19 (D-14 Q11b): the names read `Euclid`, `Radar
 * points`, and the run is one capital followed by lower-case letters and
 * digits, then any number of lower-case words. A cell that still read EUCLID
 * would claim nothing here and fail test 3 by name, which is the right way
 * round: the document's cells were re-cased with the catalog, in place.
 */
function namesIn(config: string): string[] {
  return config
    .split("/")
    .map((part) => /[A-Z][a-z0-9]*(?: [a-z0-9]+)*/.exec(part.trim()))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => match[0]);
}

/** Every name the checklist claims, deduplicated, in document order. */
const CLAIMED = [...new Set(ROWS.flatMap((row) => namesIn(row.config)))];

/** The hand-authored entries. Empty is a failure, asserted in tests 2 and 3. */
function luaEntries(): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.source.kind === "lua");
}

/** One entry's Timer text, as stored. "" is Morph's, and is legitimate. */
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
  it("keeps thirty-three numbered rows, each with a reason it cannot be simulated", () => {
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
      "the rows are numbered 1 to 22, in order",
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

  it("names only real configurations, and Mirror only as an optional row", () => {
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

    // The double condition. Mirror is blocked (D-04) on one hardware answer, so
    // it must be IN the document - as an optional row that ships nothing - and
    // OUT of the catalog. Either half alone would let it be quietly shipped or
    // quietly forgotten.
    expect(
      CLAIMED,
      `${BLOCKED} is blocked on the audition's own row 10; dropping it from ` +
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

  it("keeps the install-order rule, its reason and Morph's exemption", () => {
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

    // Morph is the exception, and the document and the data must agree on it.
    // The document's PROSE still spells the name as Phase 11 wrote it (the
    // file is append-only; only its Config cells were re-cased at 13-19), so
    // the match is without case.
    expect(flat, "Morph is described as Setup only").toMatch(
      /Morph[^.]{0,200}Setup only/i,
    );
    const morph = CATALOG.find((entry) => entry.name === "Morph");
    expect(morph, "Morph is in the catalog").toBeDefined();
    expect(
      timerOf(morph as CatalogEntry),
      "Morph's stored Timer - the document calls it Setup only, and the entry " +
        "must actually be",
    ).toBe("");
  });
});
