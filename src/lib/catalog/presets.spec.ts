// The divergence gate that replaces the read-through guarantee.
//
// THE TRADE, STATED RATHER THAN PRESENTED AS A FREE UPGRADE. Until plan 11-05,
// src/lib/catalog/entries/ported.ts read `name` and `description` through
// `presetById` on the VENDORED shelf, so a BOTOR rename could not silently
// disagree with the catalog. That guarantee is narrow - TWO STRINGS - and it is
// gone the moment HANGAR owns the values, which it now does, because while the
// definitions lived upstream no bench correction to a preset could be made here
// at all. What replaces it holds `id`, `name`, `sentence`, `category`, `knobs`,
// `exclusive`, `quiet`, `cost` AND THE WHOLE OF `state`, and it is strictly
// stronger: a re-sync that renames a card, adds a knob kind or changes a colour
// still goes red and still names the card. THE DIFFERENCE IS THAT HANGAR NOW
// HAS TO SAY WHICH DIVERGENCES ARE ON PURPOSE, AND A DIVERGENCE NOBODY WROTE
// DOWN IS A FAILURE RATHER THAN A SILENCE.
//
// That is what it costs. The read-through needed no maintenance because it made
// disagreement impossible; this needs a row, a reason, a plan and a date every
// time HANGAR changes one of the nine on purpose. The gain is that changing one
// on purpose is now possible.
//
// WHAT THIS IS NOT. It is not a fidelity gate. src/lib/fidelity/
// preset-baseline.spec.ts compares the VENDORED compiler's output against a
// fixture captured by BOTOR's own compiler in BOTOR's own tree, and it keeps
// importing `PRESETS` from src/vendor/ for exactly that reason - it is the
// PORT's gate. This file is the CATALOG's gate: it holds HANGAR's nine values
// against BOTOR's nine values. Two different questions, and running either one
// against HANGAR on both sides would answer neither.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  compile,
  cost,
  PRESETS as VENDORED_PRESETS,
  type PadPreset,
} from "../../vendor/botor/_pad";
import { padReady } from "../pad/ready";
import { PRESETS, presetById } from "./presets";

const SOURCE = readFileSync(
  new URL("./presets.spec.ts", import.meta.url),
  "utf8",
);

/**
 * A deliberate difference between HANGAR's declared preset and the vendored one
 * it was taken from. Same shape as upstream-manifest.json's intendedDivergence
 * and preset-baseline.spec.ts's own table, and for the same reason: the record
 * has to say WHY, or it is a diff a reader could have got from git.
 *
 * `path` is the full field path as test 1 reports it - `state.sends.grid`,
 * never `state`. `hangar` and `vendored` are BOTH required and are compared
 * against the real values, so a row cannot suppress a field it does not
 * actually describe.
 *
 * EMPTY WHEN PLAN 11-05 LANDED IT, AND EMPTY IS LEGIBLE HERE AS "NOT YET
 * SPENT", NOT AS "NOTHING TO DECLARE". Plan 11-06 fills it with the five
 * preset bench asks. That ordering is deliberate and it matches 11-03: the
 * record is proved to work - by the three negative checks 11-05 ran against it -
 * before anything is put in it.
 */
interface PresetDivergence {
  preset: string;
  path: string;
  hangar: unknown;
  vendored: unknown;
  reason: string;
  plan: string;
  dated: string;
}

const INTENDED_DIVERGENCE: readonly PresetDivergence[] = [];

/** `11-06`. Narrow on purpose; see the failure message in test 2. */
const PLAN_ID = /^11-[0-9]{2}$/;
const ISO_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

/** The eight the plan names. Held as a floor, never as the whole list. */
const REQUIRED_FIELDS = [
  "id",
  "name",
  "sentence",
  "category",
  "knobs",
  "exclusive",
  "quiet",
  "state",
] as const;

type Difference = { path: string; hangar: unknown; vendored: unknown };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Every leaf at which two values differ, as a full field path.
 *
 * A diff that reported only WHICH CARD changed is a diff somebody has to
 * reproduce by hand, so this walks arrays by index and objects by the UNION of
 * both key sets - a key present on one side and absent on the other is a
 * difference, not an invisible one.
 */
function differences(
  hangar: unknown,
  vendored: unknown,
  path: string,
): Difference[] {
  if (Array.isArray(hangar) || Array.isArray(vendored)) {
    if (!Array.isArray(hangar) || !Array.isArray(vendored)) {
      return [{ path, hangar, vendored }];
    }
    const out: Difference[] = [];
    if (hangar.length !== vendored.length) {
      out.push({
        path: `${path}.length`,
        hangar: hangar.length,
        vendored: vendored.length,
      });
    }
    const n = Math.max(hangar.length, vendored.length);
    for (let i = 0; i < n; i++) {
      out.push(...differences(hangar[i], vendored[i], `${path}[${i}]`));
    }
    return out;
  }
  if (isRecord(hangar) && isRecord(vendored)) {
    const keys = [
      ...new Set([...Object.keys(hangar), ...Object.keys(vendored)]),
    ].sort();
    return keys.flatMap((key) =>
      differences(hangar[key], vendored[key], `${path}.${key}`),
    );
  }
  return Object.is(hangar, vendored) ? [] : [{ path, hangar, vendored }];
}

/** Every leaf at which HANGAR's preset differs from the vendored one. */
function diffPreset(hangar: PadPreset, vendored: PadPreset): Difference[] {
  const keys = [
    ...new Set([...Object.keys(hangar), ...Object.keys(vendored)]),
  ].sort();
  return keys.flatMap((key) =>
    differences(
      (hangar as unknown as Record<string, unknown>)[key],
      (vendored as unknown as Record<string, unknown>)[key],
      key,
    ),
  );
}

const show = (value: unknown) =>
  value === undefined ? "undefined" : JSON.stringify(value);

const vendoredById = (id: string): PadPreset | undefined =>
  VENDORED_PRESETS.find((p) => p.id === id);

describe("HANGAR's nine against the vendored nine (src/lib/catalog/presets.ts)", () => {
  beforeAll(async () => {
    // measure() and cost() THROW until the WASM formatter resolves, and
    // GridScript.checkSyntax silently returns false rather than throwing - so a
    // gate that skipped this await would report every correct preset as broken,
    // and the two failure modes do not even look alike.
    await padReady();
  });

  it("differs from the vendored shelf only where a row says so", () => {
    expect(PRESETS.length, "HANGAR declares nine").toBe(9);
    for (const hangar of PRESETS) {
      const vendored = vendoredById(hangar.id);
      expect(
        vendored,
        `${hangar.id}: names no preset on the vendored shelf at all, so there ` +
          `is nothing to diff it against. Test 3 is the one that should be ` +
          `read first if this fails.`,
      ).toBeDefined();
      if (!vendored) continue;

      // The eight the plan names are a FLOOR. The walk covers the union of both
      // objects' own keys, so `cost` is held too and a re-sync that adds a
      // tenth field to PadPreset is checked on the day it arrives rather than
      // silently exempt.
      const covered = new Set([
        ...Object.keys(hangar),
        ...Object.keys(vendored),
      ]);
      for (const field of REQUIRED_FIELDS) {
        if (field === "exclusive" || field === "quiet") continue;
        expect(
          covered.has(field),
          `${hangar.id}: the diff below must cover "${field}"`,
        ).toBe(true);
      }

      for (const diff of diffPreset(hangar, vendored)) {
        const declared = INTENDED_DIVERGENCE.find(
          (row) => row.preset === hangar.id && row.path === diff.path,
        );
        expect(
          declared,
          `${hangar.id} at ${diff.path}: HANGAR has ${show(diff.hangar)} ` +
            `where the vendored shelf has ${show(diff.vendored)}, and NOBODY ` +
            `DECLARED IT. HANGAR owns the nine values, so this is allowed - ` +
            `but it has to be written down. Add a row to ` +
            `INTENDED_DIVERGENCE with this exact path, both values, a reason, ` +
            `a plan id and a date, or revert the change. An undeclared ` +
            `divergence is a failure rather than a silence: that is the whole ` +
            `trade this file was written to make.`,
        ).toBeDefined();
        if (!declared) continue;
        expect(
          declared.hangar,
          `${hangar.id} at ${diff.path}: the row's \`hangar\` value is stale`,
        ).toEqual(diff.hangar);
        expect(
          declared.vendored,
          `${hangar.id} at ${diff.path}: the row's \`vendored\` value is stale`,
        ).toEqual(diff.vendored);
      }
    }
  });

  it("carries no INTENDED_DIVERGENCE row that is unjustified or already closed", () => {
    // THE NON-VACUOUS HALF, and it is not decoration. The row loop below is
    // empty today, so without this the test would assert nothing - and this
    // repository's Vitest configuration fails a test that runs no assertions,
    // which is how 11-03 discovered that a genuinely vacuous test cannot exist
    // here. What it guards is real: a future author filling the table could
    // delete the sentence that says what the table COSTS in the same commit
    // that spends it, and the record would then read as a free upgrade.
    expect(
      SOURCE.includes(
        "HANGAR NOW\n// HAS TO SAY WHICH DIVERGENCES ARE ON PURPOSE",
      ),
      "the trade this table replaces the read-through guarantee with is still " +
        "stated verbatim in this file's header",
    ).toBe(true);
    expect(Array.isArray(INTENDED_DIVERGENCE), "the table exists").toBe(true);

    const ids = new Set(PRESETS.map((p) => p.id));
    for (const row of INTENDED_DIVERGENCE) {
      const where = `${row.preset} at ${row.path}`;
      expect(ids.has(row.preset), `${where}: names one of the nine`).toBe(true);
      expect(
        row.path.length,
        `${where}: the path is the FULL field path, as test 1 reports it`,
      ).toBeGreaterThan(0);
      expect(
        row.reason.trim().length,
        `${where}: reason must be a sentence saying what changed and why, not ` +
          `a label. A row a reader cannot act on is a diff they could have got ` +
          `from git.`,
      ).toBeGreaterThan(40);
      expect(
        PLAN_ID.test(row.plan),
        `${where}: plan must read like "11-06". The regex is NARROW ON ` +
          `PURPOSE - a phase-12 divergence is refused until somebody widens ` +
          `it deliberately, in the plan that needs it, rather than loosening ` +
          `it in confusion. Got: "${row.plan}"`,
      ).toBe(true);
      expect(ISO_DATE.test(row.dated), `${where}: dated YYYY-MM-DD`).toBe(true);

      // A ROW THAT DESCRIBES NO DIFFERENCE FAILS, so the table cannot rot into
      // an amnesty for changes that were reverted or that landed upstream.
      const hangar = presetById(row.preset);
      const vendored = vendoredById(row.preset);
      expect(hangar, `${where}: HANGAR has this preset`).toBeDefined();
      expect(
        vendored,
        `${where}: the vendored shelf has this preset`,
      ).toBeDefined();
      if (!hangar || !vendored) continue;
      const live = diffPreset(hangar, vendored).some(
        (diff) => diff.path === row.path,
      );
      expect(
        live,
        `${where}: THE TWO SIDES ARE IDENTICAL HERE, so there is no ` +
          `divergence left for this row to declare. If the change was ` +
          `reverted, or a re-sync brought BOTOR to the same value, delete the ` +
          `row - do not leave it standing as a permission for a change that ` +
          `is no longer being made.`,
      ).toBe(true);
    }
  });

  it("is the same nine, in the same order, and never a tenth", () => {
    // HANGAR owns the VALUES. It does not get to quietly add a card or drop
    // one: the catalog's ported row, the stamp's `p<id>` short form and both
    // fidelity fixtures are all indexed by these ids. A later phase that wants
    // a tenth preset changes this test deliberately, in the plan that adds it.
    expect(
      PRESETS.map((p) => p.id),
      "ids and order",
    ).toEqual(VENDORED_PRESETS.map((p) => p.id));
    expect(PRESETS.length, "count").toBe(VENDORED_PRESETS.length);
    expect(VENDORED_PRESETS.length, "the vendored shelf is still nine").toBe(9);
    expect(new Set(PRESETS.map((p) => p.id)).size, "no id appears twice").toBe(
      9,
    );
    for (const preset of PRESETS) {
      expect(presetById(preset.id), `presetById resolves ${preset.id}`).toBe(
        preset,
      );
    }
  });

  it("declares a cost the compiler agrees with, for all nine", () => {
    // Byte-exact, never "less than", and re-measured here rather than carried:
    // `cost().used` is max(raw, compressed) plus any reserved, and nine
    // published capacity numbers go stale the moment a shared codegen helper
    // moves. Plan 11-04 edited the compiler and claimed +0 on the seven it did
    // not touch; this is where that claim is checked rather than assumed.
    let checked = 0;
    for (const preset of PRESETS) {
      const measured = cost(compile(preset.state));
      expect(measured.setup.used, `${preset.id} setup`).toBe(preset.cost.setup);
      expect(measured.timer.used, `${preset.id} timer`).toBe(preset.cost.timer);
      checked += 2;
    }
    expect(checked, "eighteen figures were actually measured").toBe(18);
  });
});
