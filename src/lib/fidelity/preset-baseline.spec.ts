import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import {
  compile,
  cost,
  measure,
  padCompilerReady,
  presetById,
  PRESETS,
} from "../../vendor/botor/_pad";
import { PROTOCOL_PIN } from "../protocol-pin";

// ROADMAP criterion 3, and the D-11b half of the bump gate.
//
// The fixture this compares against was NOT produced here. It was captured by
// running BOTOR's own compiler in BOTOR's own tree at the pinned commit, by
// scripts/capture-preset-baseline.mjs. That is what makes this spec evidence
// rather than a tautology: if the vendored compiler and the fixture agree on
// all nine presets character for character, the port introduced nothing.
//
// This spec itself reads nothing outside the repository. The fixture is
// committed, so the gate is green on a machine that has never checked out the
// sibling repository - src/lib/format-parity.spec.ts stays the one deliberate
// sibling-dependent canary.
//
// THERE IS NO REGENERATION PATH FOR preset-baseline.json, AND NONE IS BEING
// ADDED. If you came here looking for an UPDATE_ environment variable because a
// preset stopped matching: there isn't one, and the absence is the point. The
// fixture is the ORIGINAL's behaviour and the copy is what is on trial, so
// rewriting it to match the copy would delete the only evidence the comparison
// rests on. Its one sanctioned way to move is a re-sync: capture-preset-baseline
// is re-run in BOTOR's tree at the NEW commit (VENDOR.md sync step 7), which
// re-takes the original's behaviour rather than recording the copy's.
//
// golden-frames.json is the other fixture in this directory and it is NOT the
// same kind of thing. Its hashes come from the simulator itself, so it is a
// regression tripwire rather than an oracle, and it DOES have a sanctioned
// regeneration path (UPDATE_GOLDEN=1, which rewrites, formats, and then fails by
// design). A moved hash there is evidence that a picture changed. A mismatch
// here is evidence that a CONTRACT broke. Do not reach for one habit while
// holding the other file.
//
// D-08, RE-CUT BY D-02 AND NOT WEAKENED. A mismatch here was, and remains, a
// STOP-and-report, never a fixture edit. D-02 permits editing the vendored
// compiler, so a small number of presets will deliberately compile to different
// Lua than BOTOR does - and every one of those differences is declared BELOW, in
// INTENDED_DIVERGENCE, per preset, per field, with the exact substring and a
// reason. The rule is not relaxed for the nine: it is SUSPENDED FOR THE NAMED
// FEW, at the named substring only, and EVERYTHING ELSE STILL STOPS. A preset
// with no row is compared character for character exactly as before, and a
// declared preset that differs anywhere other than its declared substring fails
// with the same message it always did.

interface PresetBaseline {
  stamp: string;
  timerPeriodMs: number;
  setupLua: string;
  timerLua: string;
  setupRawLength: number;
  timerRawLength: number;
  setupCompressedLength: number;
  timerCompressedLength: number;
  costSetupUsed: number;
  costTimerUsed: number;
  declaredCost: { setup: number; timer: number };
}

interface Fixture {
  capturedAt: string;
  source: {
    repository: string;
    branch: string;
    commit: string;
    compiler: string;
    protocolPin: string;
  };
  note: string;
  presets: Record<string, PresetBaseline>;
}

const fixture = JSON.parse(
  readFileSync(new URL("./preset-baseline.json", import.meta.url), "utf8"),
) as Fixture;

// D-01. A literal, not read from the fixture under test.
const PINNED_BOTOR_SHA = "a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c";

/**
 * A deliberate difference between what HANGAR's vendored compiler emits and what
 * BOTOR's emitted at the pinned commit. Same shape as upstream-manifest.json's
 * intendedDivergence and for the same reason: the record has to say WHY, or it
 * is a diff a reader could have got from git.
 *
 * `hangar` is the exact substring as HANGAR emits it; `baseline` is the exact
 * substring the fixture carries in its place. BOTH sides are required. A
 * one-sided declaration could only SUPPRESS the comparison for that preset,
 * where a two-sided one RE-CUTS it: the declared substring is substituted and
 * the rest of the string is still compared character for character.
 */
interface LuaDivergence {
  kind: "lua";
  preset: string;
  field: "setupLua" | "timerLua";
  hangar: string;
  baseline: string;
  reason: string;
  plan: string;
}

/**
 * The character cost of a Lua divergence, stated rather than recomputed. The
 * length assertions must stay pinned to a NUMBER - a length test that recomputed
 * its own expectation would assert nothing - so a divergence that changes the
 * emitted text declares exactly how many characters it spends, and the gate
 * still fails if it spends one more.
 */
interface LengthDivergence {
  kind: "length";
  preset: string;
  field:
    | "setupRawLength"
    | "timerRawLength"
    | "setupCompressedLength"
    | "timerCompressedLength"
    | "costSetupUsed"
    | "costTimerUsed";
  delta: number;
  reason: string;
  plan: string;
}

type PresetDivergence = LuaDivergence | LengthDivergence;

/**
 * SPENT BY PLAN 11-04, WHICH 11-03 BUILT THIS TABLE FOR. Five of the nine
 * presets are here - aurora, pinwheel, starfield, radar and dial, every one
 * whose touch.kind is comet or perFinger - and joystick, ninepads, faders and
 * tpad are not, because they emit no decaying glpfs at all. That split was
 * predicted twice before it was spent (by touch.kind and by scanning the
 * fixture's own glpfs calls) and observed a third time as exactly five red
 * tests on the first run after the codegen moved.
 *
 * THE DECAY ROWS CARRY NO `length` COUNTERPART AND THAT IS A MEASURED RESULT,
 * NOT AN OMISSION. The fix emits `(256 - rate) * ticks` where the literal 255
 * stood, and every one of DECAY_TABLE's twelve products is in 248..254 - three
 * digits, exactly as 255 is - so the decay change is +0 characters at every
 * reachable trailMs and no preset's declared cost moved for it.
 *
 * THE CLASS-B ROWS ARE A SECOND, DISJOINT SET AND THEY DO COST CHARACTERS.
 * Plan 11-04 also admitted the coalesced fast tap (firmware event code 9) at
 * two guards in the same compiler: LIVE, which PINWHEEL reaches, and
 * phaseCond's held arm, which RADAR, JOYSTICK and FADERS reach. Each is +7,
 * declared as three length rows per preset - raw, compressed and cost - and
 * the preset's own published `cost` figure moved with it inside _pad.ts.
 * AURORA, STARFIELD and DIAL are decay-only; NINEPADS and TPAD are in neither
 * set. So five presets diverge for the decay and four for the fast tap, with
 * PINWHEEL the one preset in both.
 *
 * Every row here must also have a counterpart in upstream-manifest.json's
 * intendedDivergence: this table records the CONSEQUENCE in the emitted Lua, and
 * that one records the CAUSE in the vendored source.
 */
const DECAY_REASON =
  "Plan 11-04, D-02. The vendored compiler emitted a decaying touch trail " +
  "starting at phase 255. Firmware walks pha += fre on a uint8_t and freezes " +
  "the cell where its timeout catches it, so the cell lands on 0 only when " +
  "the start equals (256 - rate) * ticks - 252 at the 420 ms default. " +
  "Measured before the fix: one cell frozen at phase 3 of 255, permanently, " +
  "on every cell a finger crossed. The compiler now emits 252 and pad-sim.ts " +
  "was moved with it in the same plan, so the preview and the device still " +
  "agree. +0 characters: 252 and 255 are both three digits.";

const LIVE_REASON =
  "Plan 11-04, D-02, class B. Firmware coalesces a sub-cycle press-and-lift " +
  "into ONE message with event code 9, and the compiler's LIVE guard read " +
  "`e~=3 and e<5`, which is false for 9 - so a fast tap ran no live path at " +
  "all. Measured through a real Lua VM before the fix: PINWHEEL's perFinger " +
  "layer record after a fast tap was pha 0 / fre 0 / timeout 0, where a slow " +
  "press wrote 207 / 250 / 34. The trail did not exist. `or e>8` admits the " +
  "tap and Lua binds `and` tighter than `or`, so this parses as " +
  "(e~=3 and e<5) or (e>8). +7 characters. ENDED is byte-unchanged: all ten " +
  "of its sites are release paths where code 9 genuinely IS an end.";

const HELD_REASON =
  "Plan 11-04, D-02, class B. phaseCond's HELD arm is the guard every " +
  "sends emitter that respects sends.phase is wrapped in, and all nine " +
  'presets are "held". `e==1 or e==4` is false for the coalesced fast tap, ' +
  "so the whole gesture was thrown away. Measured before the fix: a fast " +
  "tap sent 0 controller messages on RADAR against 2 on a slow press, 2 on " +
  "JOYSTICK against 4, and 0 on FADERS against 1 with the fader column left " +
  "unlit. +7 characters. The PRESS arm carries the same defect and is " +
  "deliberately NOT changed: sends.phase is not a HANGAR knob, so no state " +
  "a visitor can reach compiles it.";

const CLASS_B_LENGTH_REASON =
  "The seven characters the class-B guard fix above spends, stated rather " +
  "than recomputed. Setup only: no preset's Timer carries either guard. " +
  "The compressed length moves by the same seven because the pinned " +
  "minifier does not rewrite a comparison chain, and cost().used is " +
  "max(raw, compressed) + reserved with raw winning for all nine, so it " +
  "moves by seven too. The declared cost on the preset itself moved with " +
  "it - see upstream-manifest.json - because pad.test.js asserts those " +
  "byte-exact rather than as an upper bound.";

const INTENDED_DIVERGENCE: readonly PresetDivergence[] = [
  {
    kind: "lua",
    preset: "aurora",
    field: "setupLua",
    hangar: "glpfs(a,1,252,250,0)",
    baseline: "glpfs(a,1,255,250,0)",
    reason: DECAY_REASON,
    plan: "11-04",
  },
  {
    kind: "lua",
    preset: "pinwheel",
    field: "setupLua",
    hangar: "glpfs(a,1,252,250,0)",
    baseline: "glpfs(a,1,255,250,0)",
    reason: DECAY_REASON,
    plan: "11-04",
  },
  {
    kind: "lua",
    preset: "starfield",
    field: "setupLua",
    hangar: "glpfs(a,1,252,250,0)",
    baseline: "glpfs(a,1,255,250,0)",
    reason: DECAY_REASON,
    plan: "11-04",
  },
  {
    kind: "lua",
    preset: "radar",
    field: "setupLua",
    hangar: "glpfs(a,1,252,250,0)",
    baseline: "glpfs(a,1,255,250,0)",
    reason: DECAY_REASON,
    plan: "11-04",
  },
  {
    kind: "lua",
    preset: "dial",
    field: "setupLua",
    hangar: "glpfs(a,1,252,250,0)",
    baseline: "glpfs(a,1,255,250,0)",
    reason: DECAY_REASON,
    plan: "11-04",
  },
  {
    kind: "lua",
    preset: "pinwheel",
    field: "setupLua",
    hangar: "e~=3 and e<5 or e>8",
    baseline: "e~=3 and e<5",
    reason: LIVE_REASON,
    plan: "11-04",
  },
  ...(["radar", "joystick", "faders"] as const).map(
    (preset): PresetDivergence => ({
      kind: "lua",
      preset,
      field: "setupLua",
      hangar: "e==1 or e==4 or e>8",
      baseline: "e==1 or e==4",
      reason: HELD_REASON,
      plan: "11-04",
    }),
  ),
  ...(["pinwheel", "radar", "joystick", "faders"] as const).flatMap(
    (preset): PresetDivergence[] =>
      (
        ["setupRawLength", "setupCompressedLength", "costSetupUsed"] as const
      ).map((field) => ({
        kind: "length",
        preset,
        field,
        delta: 7,
        reason: CLASS_B_LENGTH_REASON,
        plan: "11-04",
      })),
  ),
];

const luaRowsFor = (id: string, field: "setupLua" | "timerLua") =>
  INTENDED_DIVERGENCE.filter(
    (row): row is LuaDivergence =>
      row.kind === "lua" && row.preset === id && row.field === field,
  );

const lengthDeltaFor = (id: string, field: LengthDivergence["field"]) =>
  INTENDED_DIVERGENCE.filter(
    (row): row is LengthDivergence =>
      row.kind === "length" && row.preset === id && row.field === field,
  ).reduce((n, row) => n + row.delta, 0);

/**
 * Substitute a declared divergence out of HANGAR's output so the REST of the
 * string is still compared character for character. Exactly once, for the same
 * reason the manifest's rows are: a substring that matched twice means the
 * declaration reached a site nobody wrote down, and the second site would then
 * be silently excused. Widen the substring until it is unique rather than
 * loosening this.
 */
function applyDivergences(
  id: string,
  field: "setupLua" | "timerLua",
  emitted: string,
): string {
  let out = emitted;
  for (const row of luaRowsFor(id, field)) {
    const hits = out.split(row.hangar).length - 1;
    expect(
      hits,
      `${id} ${field}: the declared intended divergence must occur exactly once in HANGAR's output, found ${hits}. Declared by plan ${row.plan}, because: ${row.reason}\n  ${row.hangar}`,
    ).toBe(1);
    out = out.replace(row.hangar, row.baseline);
  }
  return out;
}

// presetById returns PadPreset | undefined and expect(...).toBeDefined() does
// not narrow it for the type checker, so every lookup goes through here.
function mustPreset(id: string) {
  const preset = presetById(id);
  if (!preset) throw new Error(`presetById("${id}") returned undefined`);
  return preset;
}

describe("nine shelf presets against BOTOR's own compiler (criterion 3)", () => {
  const ids = Object.keys(fixture.presets);

  beforeAll(async () => {
    // measure() and cost() THROW until the WASM formatter has resolved. That
    // throw is the FOUND-05 gate working as designed, not a test bug - they
    // never return a wrong number.
    await padCompilerReady();
  });

  it.each(ids)(
    "%s compiles to character-identical Setup and Timer Lua",
    (id) => {
      const built = compile(mustPreset(id).state);
      const f = fixture.presets[id];
      const declared = INTENDED_DIVERGENCE.filter((row) => row.preset === id);
      const stop =
        declared.length === 0
          ? "A single character of drift in the emitted Lua is a compiler difference between HANGAR's copy and BOTOR's original, which is the exact thing this phase exists to rule out. This is a STOP-and-report, never a fixture edit (D-08): the fixture is the original's behaviour, and the copy is what is on trial."
          : `This preset has ${declared.length} declared intended divergence(s), and they have already been substituted out before this comparison. A difference that survives that substitution is at a site NOBODY DECLARED, and it is a STOP-and-report exactly as it always was (D-08). Declare it in INTENDED_DIVERGENCE with a reason, or revert it - never edit the fixture.`;

      // Character-identical, not "equivalent", everywhere a divergence has not
      // been declared and substituted.
      expect(
        applyDivergences(id, "setupLua", built.setupLua),
        `${id} setup Lua. ${stop}`,
      ).toBe(f.setupLua);
      expect(
        applyDivergences(id, "timerLua", built.timerLua),
        `${id} timer Lua. ${stop}`,
      ).toBe(f.timerLua);
      expect(built.stamp, `${id} stamp`).toBe(f.stamp);
      expect(built.timerPeriodMs, `${id} timer period`).toBe(f.timerPeriodMs);
    },
  );

  it.each(ids)(
    "%s raw and compressed lengths equal the recorded baseline",
    (id) => {
      const f = fixture.presets[id];
      const built = compile(mustPreset(id).state);
      const c = cost(built);
      // Every expectation stays a NUMBER: the fixture's, plus the character
      // cost a divergence DECLARED it would spend. Nothing here is recomputed
      // from the thing under test.
      const at = (field: LengthDivergence["field"]) =>
        lengthDeltaFor(id, field);
      expect(built.setupLua.length, `${id} setup raw`).toBe(
        f.setupRawLength + at("setupRawLength"),
      );
      expect(built.timerLua.length, `${id} timer raw`).toBe(
        f.timerRawLength + at("timerRawLength"),
      );
      // measure() is GridScript.compressScript(lua).length. cost().used is
      // max(compressed, raw) + reserved and raw wins for all nine presets today,
      // so the compressed pair is the only number that can see minifier drift.
      expect(measure(built.setupLua), `${id} setup compressed`).toBe(
        f.setupCompressedLength + at("setupCompressedLength"),
      );
      expect(measure(built.timerLua), `${id} timer compressed`).toBe(
        f.timerCompressedLength + at("timerCompressedLength"),
      );
      expect(c.setup.used, `${id} setup cost`).toBe(
        f.costSetupUsed + at("costSetupUsed"),
      );
      expect(c.timer.used, `${id} timer cost`).toBe(
        f.costTimerUsed + at("costTimerUsed"),
      );
    },
  );

  it("the fixture covers exactly the vendored catalog at the pinned protocol version", () => {
    expect([...PRESETS].map((p) => p.id).sort()).toEqual(ids.slice().sort());
    expect(ids).toHaveLength(9);
    expect(fixture.source.protocolPin).toBe(PROTOCOL_PIN);
    expect(fixture.source.commit).toBe(PINNED_BOTOR_SHA);
  });

  it("every declared preset divergence is real and justified - VACUOUS over the rows while the table is empty, and not vacuous about the rule", () => {
    // READ THIS BEFORE TRUSTING A GREEN RUN. INTENDED_DIVERGENCE is EMPTY as of
    // plan 11-03, which built the table and spent none of it. The row loop below
    // therefore checks nothing today, and green here means "there are no
    // declared divergences", not "the declared divergences are honest". 11-04 is
    // what makes that loop load-bearing.
    //
    // THE HALF THAT IS NOT VACUOUS, and it is the half this table could most
    // easily destroy: the rule it suspends has to stay WRITTEN, verbatim, in the
    // file whose failure a reader will be staring at. A future author adding
    // rows here and quietly deleting the D-08 paragraph while they were at it
    // would leave a gate that permits divergence and no longer says what stops
    // one. That is what this assertion refuses.
    const self = readFileSync(new URL(import.meta.url), "utf8");
    expect(
      self,
      "the D-08 rule must stay stated verbatim in this file's header: a mismatch outside a declared divergence is a STOP-and-report, never a fixture edit. INTENDED_DIVERGENCE suspends that rule for the named few and for nothing else, and the sentence it suspends must remain readable at the point of failure.",
    ).toContain("STOP-and-report, never a fixture edit");

    for (const row of INTENDED_DIVERGENCE) {
      const where = `${row.preset} ${row.field}`;

      expect(
        ids,
        `${where}: declares a divergence for a preset the fixture does not carry`,
      ).toContain(row.preset);

      // A row that says only WHAT changed is a diff. The reason is what lets a
      // re-syncer judge whether an upstream fix has retired it.
      expect(
        row.reason?.trim().length ?? 0,
        `${where}: reason must be a sentence saying what changed in the emitted Lua and why. Got: ${JSON.stringify(row.reason)}`,
      ).toBeGreaterThan(20);
      expect(
        row.plan,
        `${where}: plan must name the plan that chose this divergence, as "11-NN". Got: ${JSON.stringify(row.plan)}`,
      ).toMatch(/^11-[0-9]{2}$/);

      if (row.kind === "length") {
        expect(
          row.delta,
          `${where}: a length divergence of 0 characters records nothing. Delete the row.`,
        ).not.toBe(0);
        continue;
      }

      const built = compile(mustPreset(row.preset).state);
      const emitted = built[row.field];
      const recorded = fixture.presets[row.preset][row.field];

      // THE TABLE CANNOT ACCUMULATE ROWS FOR DIVERGENCES THAT WERE REVERTED.
      // Each of the four assertions below is one half of "these two strings
      // really do differ, here, in the direction claimed".
      expect(
        row.hangar,
        `${where}: the declared HANGAR substring and the declared baseline substring are identical, so this row declares no divergence at all. If the fix was reverted, delete the row; the table is not a place to note that nothing changed.`,
      ).not.toBe(row.baseline);
      expect(
        emitted.includes(row.hangar),
        `${where}: the declared HANGAR substring does not appear in what HANGAR actually emits. Either the text moved or the row is stale.\n  ${row.hangar}`,
      ).toBe(true);
      expect(
        recorded.includes(row.hangar),
        `${where}: the declared HANGAR substring is ALREADY IN THE FIXTURE, so BOTOR emits it too and there is no divergence here to declare. If the fix was reverted or landed upstream, delete the row.\n  ${row.hangar}`,
      ).toBe(false);
      expect(
        recorded.includes(row.baseline),
        `${where}: the declared baseline substring does not appear in the fixture, so this row does not describe what BOTOR emits.\n  ${row.baseline}`,
      ).toBe(true);
    }
  });
});
