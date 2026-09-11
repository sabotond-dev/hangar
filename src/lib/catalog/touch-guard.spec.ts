// The class-B gate: a fast tap is a press AND a lift, and no guard may read it
// as only one of them.
//
// ---------------------------------------------------------------------------
// WHAT THE FIRMWARE SENDS, AND WHERE THAT IS ALREADY WRITTEN DOWN
// ---------------------------------------------------------------------------
//
// The touch event code is `status & 0x0f`, forwarded untranslated from the
// maXTouch T100. THIS FILE DOES NOT RESTATE THE TABLE. Two statements of it
// already exist and a third would drift away from both:
//
//   - `src/vendor/botor/pad-sim.ts:228-241` - the simulator's own words, beside
//     the constants it dispatches with, including the note that firmware
//     coalesces a sub-cycle press-and-lift into ONE message carrying the raw
//     T100 DOWNUP nibble and no separate DOWN or UP.
//   - `../zona-docs/docs/ZONA_REFERENCE.md` section 4.6 - the reference, which
//     is where a reader who does not have this repository open will look.
//
// The four codes that matter to a configuration author are 1 MOVE, 4 DOWN,
// 5 UP and 9 DOWNUP, and only the first three are ever produced by a finger
// moving slowly enough to see. 9 is the fast tap.
//
// ---------------------------------------------------------------------------
// THE CONVENTION THIS FILE ENFORCES
// ---------------------------------------------------------------------------
//
// There are four intents an author can have and each has ONE correct spelling:
//
//   this contact ENDED   -> e == 3 or e >= 5 and e < 9
//   this contact STARTED -> e == 4 or e > 8
//   this contact is LIVE -> if e ~= 1 and e ~= 4 and e < 9 then return end
//   taps only, not drags -> if e ~= 4 and e < 9 then return end
//
// Tests 1 and 2 police the first two. The other two spellings are self-guarding
// - they name 9 by admitting everything at or above it - and are not triggers.
//
// WHY IT MATTERS, AND IT IS NOT THEORETICAL. Five surviving entries wrote
// "contact ended" as `e == 3 or e >= 5` with no upper bound, so a fast tap was
// classified as a lift, the press it also carried was thrown away, and the
// configuration produced NOTHING AT ALL. Counted through the real Lua host in
// 11-RESEARCH: LATTICE 0 messages on a fast tap against 2 on a slow one
// (LATTICE was removed by plan 12-04; the measurement is why this file exists),
// CHORUS 0 against 6, MORPH 0 against 4, GHOST 0 against 8. That is what the
// bench reported as "not precise enough" - the entries were not imprecise, they
// were ignoring the touch. Plan 11-02 fixed all five at +8 characters a site
// and this file is why the sixth cannot happen: waves 11 to 15 author four new
// configurations, and six entries were already writing the guard correctly, so
// this was never a missing convention - it was an unchecked one.
//
// `entries/quadrant.ts` IS THE WORKED EXAMPLE OF THE FULL TREATMENT and it is
// cited rather than restated: it not only escapes 9 from its "ended" guard, it
// then handles `e == 9` explicitly on the onset path by sending the note-off
// immediately, because a coalesced tap has no lift coming later to send it.
//
// ---------------------------------------------------------------------------
// HOW THE SCAN WORKS, AND WHY IT IS CHAINS RATHER THAN SUBSTRINGS
// ---------------------------------------------------------------------------
//
// A substring scan cannot tell `(e==1 or e==4)` - a LIVE test, where excluding
// 9 is correct because the contact is already gone - from a bare `e==4` used as
// an onset. So the scan collects every event-code COMPARISON in a body and
// groups consecutive ones into CHAINS, where two comparisons join a chain when
// the only thing between them is `and` or `or` and brackets. The intent is then
// read off the chain rather than off one comparison, which is how SHUTTLE's
// `(e==1 or e==4)` WAS classified as live and skipped with a reason instead of
// being reported as a missing onset escape. Plan 12-04 removed SHUTTLE; the
// chain rule is kept because it is the rule, not because that entry needed it.
//
// EVERY NEEDLE IS ASSEMBLED FROM FRAGMENTS AT RUN TIME. This file's own prose
// and failure messages necessarily contain the exact text they forbid, and a
// gate that matches its own source is a gate nobody can edit. The house answer
// is `src/lib/protocol/forbidden-instructions.spec.ts`'s and
// `lua-entries.sweep.spec.ts` test 4's: build the needle from pieces. Today
// this file scans catalog Lua rather than source files, so the collision is not
// yet reachable - widening it to a source scan later is one line, and it is
// safe because of this.
//
// THREE TESTS, AND THE COUNT NEVER MOVES. Each loops over the catalog
// internally and names the entry, the event and the branch, so a wave that adds
// or removes a configuration moves no number here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CATALOG, type CatalogEntry } from "./index";
import {
  AND,
  EQ,
  F,
  GE,
  GT,
  LT,
  OR,
  V,
  branchOf,
  chainsOf,
  comparisonsIn,
  endedEscapes,
  is,
  isEndedOpener,
  isLiveTest,
  startedAdmits,
  type Chain,
} from "./touch-guard";

const EVENTS = ["setup", "timer"] as const;
type EventName = (typeof EVENTS)[number];

// The fragments and the scanner live in touch-guard.ts since plan 13-14, so
// the Sandbox emitter's spec runs these needles rather than a rewrite of them
// (the header's fragment rule still holds: the module assembles them at run
// time, and this file's prose still names none of them).

/**
 * A site excused from a test, with the reason a reader needs to learn WHY
 * rather than to learn that the gate has holes.
 *
 * `branch` is the whole `if` or `elseif` clause as it appears in the entry's
 * Lua, NOT just the comparison - because in both rows below the guard is
 * correct BECAUSE OF THE CODE AROUND IT, and an excuse keyed on the comparison
 * alone would go on excusing the same text moved somewhere it is genuinely
 * wrong. Test 3 proves that: a row whose branch no longer appears fails.
 *
 * ONE ROW SINCE PLAN 12-04. It was two; FORGE's onset row left with FORGE when
 * the user's bench report removed the entry, so the table shrank by a deletion
 * rather than by a fix, and test 3's closure rule is what kept it honest.
 *
 * FOUR ROWS SINCE PLAN 12-10. TRACKPAD carries the vendored trackpad recipe's
 * three event-code guards verbatim - a hardware-tested recipe that handles a
 * code 9 by REGISTERING it as an onset and ENDING it in the same pass, which is
 * exactly what makes a fast tap click - and the letter of both rules reads all
 * three as wrong. The three rows say why the text is right because of the
 * order around it, and all three are keyed on the whole branch so that the
 * same text moved somewhere else stops being excused.
 */
type DeclaredException = {
  readonly entry: string;
  readonly event: EventName;
  readonly rule: "ended" | "started";
  /** The full branch clause, verbatim, tokens and all. */
  readonly branch: string;
  readonly reason: string;
};

const DECLARED_EXCEPTIONS: readonly DeclaredException[] = [
  {
    entry: "stage",
    event: "setup",
    rule: "ended",
    branch: F("elseif ", V, GE, "5"),
    reason:
      "Preceded in the same if-chain by " +
      F("if ", V, EQ, "4 ", OR, " ", V, GT, "8") +
      ", so code 9 takes the FIRST branch and never reaches this one. The " +
      "guard is correct because of the chain around it, not because of its " +
      "own text, and a scan of the text alone cannot see that. STAGE also " +
      "reads the code on the first branch - it lights the zone at rate 4 for " +
      "a fast tap and 24 for a held press - so it is not merely tolerating 9, " +
      "it is using it.",
  },
  {
    entry: "trackpad",
    event: "setup",
    rule: "ended",
    branch: F(
      "if s.q>25 then z(s)end s.q=0 local o,g,f,h=true,0,0,0 while o and ",
      "g<24 do g=g+1 local c,t=s.p[i],",
      V,
      EQ,
      "3 ",
      OR,
      " ",
      V,
      GE,
      "5",
    ),
    reason:
      "The vendored trackpad recipe's `t`, computed BEFORE the onset test " +
      F("if ", V, EQ, "4 ", OR, " ", V, GT, "7") +
      " that follows it in the same pass. A code 9 is therefore registered " +
      "as a new contact first (`c={x,y}`) and ended second (`s.p[i]=nil`, " +
      "the count falls to zero, the click test runs) - which is what turns " +
      "a hardware fast tap into a click. Adding `and e<9` here would " +
      "register the tap and never end it, so the click would never fire. " +
      "The recipe is `_pad.ts` trackpadSetup, hardware-tested, carried " +
      "byte for byte into a hand-authored entry by plan 12-10.",
  },
  {
    entry: "trackpad",
    event: "setup",
    rule: "ended",
    branch: F("if s.r<1 and ", V, GT, "4"),
    reason:
      "The click test, reached only inside `if t then if c then ... if " +
      "s.n<1 then` - so the contact has ALREADY ended by the recipe's own " +
      "`t`. This comparison asks whether that end was a real lift (5 or 9) " +
      "rather than a code 3, because only a lift clicks; a fast tap IS a " +
      "lift, and excluding 9 here would be the exact defect the rule " +
      "exists to prevent. Same recipe, same plan.",
  },
  {
    entry: "trackpad",
    event: "setup",
    rule: "started",
    branch: F("if ", V, EQ, "4 ", OR, " ", V, GT, "7"),
    reason:
      "Admits 8 and 9 both, which is a superset of what the rule asks for " +
      "(`>8`); the gate reads the literal and not the range. The recipe " +
      "spells it `>7` and it is carried unchanged rather than narrowed, " +
      "because narrowing a hardware-tested guard to satisfy a text scan " +
      "would be a behaviour change on code 8 that nobody measured.",
  },
];

// ---------------------------------------------------------------------------
// The bodies
// ---------------------------------------------------------------------------

type Body = {
  readonly entry: CatalogEntry;
  readonly event: EventName;
  readonly text: string;
  readonly chains: readonly Chain[];
};

function luaEntries(): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.source.kind === "lua");
}

/**
 * Every hand-authored body, with its chains.
 *
 * The TEMPLATES are scanned, tokens and all, because an event-code guard is
 * authored text and never a knob value. That is not assumed: the walk also
 * checks every declared knob value and fails if one carries a comparison, so
 * the hole a template-only scan would leave is closed rather than hoped about.
 */
function bodies(): Body[] {
  const out: Body[] = [];
  for (const entry of luaEntries()) {
    const source = entry.source;
    if (source.kind !== "lua") continue;
    for (const event of EVENTS) {
      const text = event === "setup" ? source.setup : source.timer;
      if (text === "") continue;
      out.push({
        entry,
        event,
        text,
        chains: chainsOf(text, comparisonsIn(text)),
      });
    }
  }
  return out;
}

const BODIES = bodies();

/** The touch-callback assignment, as the entries spell it. */
const TOUCH_CB = F("touch", "_cb", "=function");

function excuseFor(
  body: Body,
  chain: Chain,
  rule: "ended" | "started",
): DeclaredException | undefined {
  const branch = branchOf(body.text, chain);
  return DECLARED_EXCEPTIONS.find(
    (row) =>
      row.entry === body.entry.id &&
      row.event === body.event &&
      row.rule === rule &&
      row.branch === branch,
  );
}

// ---------------------------------------------------------------------------

describe("the fast-tap guard", () => {
  it("1. every 'contact ended' guard escapes the fast tap", () => {
    const problems: string[] = [];
    let examined = 0;
    const used: DeclaredException[] = [];

    for (const body of BODIES) {
      for (const chain of body.chains) {
        for (let i = 0; i < chain.members.length; i += 1) {
          const member = chain.members[i];
          if (!isEndedOpener(member)) continue;
          examined += 1;
          if (endedEscapes(chain, i)) continue;
          const excuse = excuseFor(body, chain, "ended");
          if (typeof excuse !== "undefined") {
            used.push(excuse);
            continue;
          }
          problems.push(
            F(
              '"this contact ended" is written `',
              V,
              EQ,
              "3 ",
              OR,
              " ",
              V,
              GE,
              "5 ",
              AND,
              " ",
              V,
              LT,
              "9`; code 9 is a down AND an up, and treating it as a plain end " +
                "throws the onset away, so a fast tap produces nothing at all. ",
            ) +
              `${body.entry.id}.${body.event} writes ` +
              `\`${branchOf(body.text, chain)}\`. ` +
              "Escape it, or declare it in DECLARED_EXCEPTIONS with a reason.",
          );
        }
      }
    }

    // NON-VACUITY, derived rather than hard-coded: every entry that installs a
    // touch callback must have yielded at least one event-code chain. A walk
    // that read nothing would pass every assertion above by finding nothing.
    //
    // UNLESS IT DELEGATES THE EVENT-CODE TEST TO THE TOUCH LIBRARY, AND THAT IS
    // NOT A SKIP (plan 12-08). EUCLID, STEPS, RADAR POINTS and SONAR used to
    // open their callbacks with the LIVE spelling and then dedup on a cell they
    // computed themselves; all four now open with `Q(s,i,e,x,y)` and carry no
    // event-code comparison of their own, because the library's `Q` is where
    // the end test and the onset test moved. A body in that shape is REQUIRED
    // to carry the call - the assertion below is the same non-vacuity question
    // asked of a different observable, not an exemption from it - and the
    // library's own chains are gated where the library lives: `library.spec.ts`
    // asserts ZERO "contact ended" sites in the string and exactly one onset
    // written as the blessed spelling.
    //
    // WHY THIS IS NOT SPELLED FROM FRAGMENTS like every needle above: the
    // fragment rule exists because this file's prose and failure messages
    // necessarily contain the event-code text they FORBID, and a gate that
    // matches its own source is a gate nobody can edit. This needle is text the
    // entries are REQUIRED to contain, so a self-match would be a false GREEN
    // on this file rather than a false red on an entry - and this file is not
    // in the corpus either way.
    const LIBRARY_CELL_CALL = "Q(s,i,e,x,y)";
    let callbacks = 0;
    let delegated = 0;
    for (const body of BODIES) {
      if (!body.text.includes(TOUCH_CB)) continue;
      callbacks += 1;
      if (body.chains.length > 0) continue;
      delegated += 1;
      expect(
        body.text,
        `${body.entry.id}.${body.event} installs a touch callback, the scan ` +
          "found no event-code comparison in it, and it does not call the " +
          "touch library either - so either the walk is not reading what it " +
          "claims to read, or an entry is acting on a raw event code with no " +
          "guard at all",
      ).toContain(LIBRARY_CELL_CALL);
    }
    // BOUNDED FROM BOTH ENDS, AND NEITHER BOUND IS A CATALOG COUNT. At least
    // one entry delegates, so the arm above is not dead code; at least one
    // still carries its own chain, so a walk that had stopped reading could not
    // hide by putting every body in the delegating arm. Waves 8 to 11 add
    // callers of the library without moving either number, which is the point:
    // a literal four here would be a count of the catalog wearing the costume
    // of an invariant.
    expect(
      [delegated > 0, delegated < callbacks],
      "some entries delegate the event-code test to the touch library and " +
        `some still write it themselves - ${delegated} of ${callbacks} ` +
        "touch-callback bodies delegate",
    ).toEqual([true, true]);
    expect(
      examined,
      "the scan found 'contact ended' guards to check",
    ).toBeGreaterThan(0);
    expect(problems.join("\n\n"), "unescaped 'contact ended' guards").toBe("");
    expect(used.length, "declared exceptions consumed by this test").toBe(
      DECLARED_EXCEPTIONS.filter((row) => row.rule === "ended").length,
    );
  });

  it("2. every 'contact started' guard admits the fast tap", () => {
    const problems: string[] = [];
    let examined = 0;
    const used: DeclaredException[] = [];

    for (const body of BODIES) {
      for (const chain of body.chains) {
        // A chain naming code 1 is asking whether the contact is LIVE, and
        // excluding 9 there is correct: a coalesced tap is already over.
        if (isLiveTest(chain)) continue;
        if (!chain.members.some((c) => is(c, EQ, 4))) continue;
        examined += 1;
        if (startedAdmits(chain)) continue;
        const excuse = excuseFor(body, chain, "started");
        if (typeof excuse !== "undefined") {
          used.push(excuse);
          continue;
        }
        problems.push(
          F(
            '"this contact started" is written `',
            V,
            EQ,
            "4 ",
            OR,
            " ",
            V,
            GT,
            "8`; code 9 is a down AND an up, and a bare test for 4 misses " +
              "every fast tap, so the gesture never begins. ",
          ) +
            `${body.entry.id}.${body.event} writes ` +
            `\`${branchOf(body.text, chain)}\`. ` +
            "Admit it, or declare it in DECLARED_EXCEPTIONS with a reason.",
        );
      }
    }

    expect(
      examined,
      "the scan found 'contact started' guards to check",
    ).toBeGreaterThan(0);
    expect(problems.join("\n\n"), "onset guards that miss the fast tap").toBe(
      "",
    );
    expect(used.length, "declared exceptions consumed by this test").toBe(
      DECLARED_EXCEPTIONS.filter((row) => row.rule === "started").length,
    );
  });

  it("3. DECLARED_EXCEPTIONS is justified and closed", () => {
    const problems: string[] = [];

    for (const row of DECLARED_EXCEPTIONS) {
      // A row without a reason is an excuse, not a declaration.
      if (row.reason.trim().length < 40) {
        problems.push(
          `${row.entry}.${row.event} is declared with no usable reason. A row ` +
            "here must teach the next reader why the guard is correct, in a " +
            "sentence, the way EXCLUDED_FROM_ROW and INTENDED_DIVERGENCE are " +
            "written.",
        );
      }
      // A row whose branch no longer appears is stale, and a stale row is a
      // standing amnesty for text nobody has read in a year.
      const body = BODIES.find(
        (candidate) =>
          candidate.entry.id === row.entry && candidate.event === row.event,
      );
      if (typeof body === "undefined") {
        problems.push(
          `DECLARED_EXCEPTIONS names ${row.entry}.${row.event}, which is not ` +
            "in the catalog. Delete the row.",
        );
        continue;
      }
      const found = body.chains.some(
        (chain) => branchOf(body.text, chain) === row.branch,
      );
      if (!found) {
        problems.push(
          `DECLARED_EXCEPTIONS excuses ${row.entry}.${row.event} at ` +
            `\`${row.branch}\`, and that branch no longer appears in the ` +
            "entry. The exception is about the BRANCH, not about the file - " +
            "delete the row, or restore the context that made it correct.",
        );
      }
    }

    const seen = new Set<string>();
    for (const row of DECLARED_EXCEPTIONS) {
      const key = `${row.entry}.${row.event}.${row.rule}.${row.branch}`;
      if (seen.has(key)) {
        problems.push(`DECLARED_EXCEPTIONS names ${key} twice.`);
      }
      seen.add(key);
    }

    expect(problems.join("\n\n"), "the exception table is honest").toBe("");

    // The record itself, printed so a reader of a green run still sees it.
    const roll = DECLARED_EXCEPTIONS.map(
      (row) =>
        `${row.entry}.${row.event} (${row.rule}): \`${row.branch}\` - ${row.reason}`,
    ).join("\n\n");
    expect(roll, "every declared exception carries its reason").toContain(
      "stage",
    );
    // 2 -> 1: FORGE was the second row and plan 12-04 removed the entry.
    // 1 -> 4: TRACKPAD's three, plan 12-10 - the vendored trackpad recipe's
    // guards carried verbatim into a hand-authored entry, each one right
    // because of the pass around it. Tests 1 and 2 print all three.
    expect(DECLARED_EXCEPTIONS.length, "the declared false positives").toBe(4);
    expect(
      DECLARED_EXCEPTIONS.filter((row) => row.entry === "trackpad").length,
      "trackpad's rows: two ended, one started",
    ).toBe(3);
  });
});
