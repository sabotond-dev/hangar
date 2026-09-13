// The class-A gate: a decaying layer must land on phase 0. THREE TESTS, AND THE COUNT NEVER
// MOVES: each loops over the catalog and names the entry, the event and the site. This file is
// the permanent home of the decay idiom - both statements of it below were moved here verbatim
// out of the deleted `entries/life.ts` and `entries/gridlock.ts` and are the only surviving
// copy; the four numbered sections are what the assertions rest on, and the tests' messages
// cite them by number.
// Decided at 11-01; see .planning/phases/11-bench-corrections/11-01-SUMMARY.md
//
// 1. THE MECHANISM
//
// `pha` is a `uint8_t` and `+=` WRAPS: firmware's `grid_led.c:190-211` does `pha += fre` on a
// byte, and `src/vendor/botor/pad-sim.ts:883-891` reproduces it as `L.pha = (L.pha + L.fre) &
// 255`. Nothing clamps and nothing stops - a "decay" is a walk around a 256-value ring, and a
// rate above 128 is a small step downwards taken by adding a large number. When the `glt`
// countdown reaches zero, firmware sets the rate to 0 and the layer holds whatever phase it is
// sitting on, forever; shape 0 renders intensity = phase, so a layer frozen at 3 is a cell very
// slightly and permanently lit. THE FREEZE POINT IS EXACTLY
//
//     frozen = (start + rate * timeout) mod 256
//
// and the rule this file enforces is that it must be 0. (255 + 250 * 42) mod 256 is 3 - the
// pair GHOST and SONAR once shipped; EUCLID's `@TRAIL` at 100 froze at 167 by the same arithmetic.
//
// 2. THE LITERAL-PARAMETERISED FORM (moved from `life.ts:59-61`)
//
//     glpfs(a, l, 252, 256 - 252//T, 0)   plus   glt(a, l, T)
//
// T must be an EXACT DIVISOR of 252: the emitted step is the integer quotient `252//T`, so the
// walk lands on `252 - T * (252//T)`, which is 0 only when the division is exact. The fifteen
// usable timeouts are 4, 6, 7, 9, 12, 14, 18, 21, 28, 36, 42, 63, 84, 126, 252 (1, 2 and 3
// satisfy the arithmetic too and are excluded as degenerate - a flicker, not a decay; the tests
// check the ARITHMETIC, not this list). 252 rather than 255 because it has eighteen divisors
// against eight; 256 cannot be a starting phase at all. Worked examples: `entries/cull.ts`'s
// `@FLASH` and `entries/steps.ts`'s `@TRAIL`.
//
// 3. THE COMPUTED FORM (moved from `gridlock.ts:129` and `:194-200`)
//
//     glpfs(a, l, p, R, 0)   plus   glt(a, l, (256 - p)//R)
//
// When the starting phase is COMPUTED at run time, the timeout is DERIVED from it: the walk
// lands on `p + R * (256 - p)/R = 256 = 0` for every `p` that R divides. The entry then owes one
// guarantee the gate cannot see - every value `p` can take must be a multiple of R (GRIDLOCK
// declared R = 4 and constrained `@SPREAD` to multiples of four; `entries/chorus.ts` is the live
// worked example). A COMPUTED START WITH A FIXED TIMEOUT IS THE BUG: CHORUS once shipped
// `glpfs(a,2,255-...*22//1,@BLOOMRATE,0)` with `glt(a,2,64)`, and `@BLOOMRATE * 64 mod 256` is 0
// for every multiple of 4, so the layer froze at the brightness it opened on.
//
// 4. WHAT THIS FILE DOES NOT CHECK
//
// A `glpfs` whose shape argument is not 0 is a KEEPER, not a decay - a shaped oscillation the
// author intends to run forever under a long `glt`; ARC, POMODORO and STAGE carry one deliberately
// and all are skipped. A `glt` of 0 cancels rather than schedules and is skipped too.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CATALOG, type CatalogEntry, type LuaKnob } from "./index";

const EVENTS = ["setup", "timer"] as const;
type EventName = (typeof EVENTS)[number];

/**
 * A site that is known to be wrong and is scheduled to be fixed.
 *
 * The table is EXHAUSTIVE AND SHRINKING, which is two rules in one and both are
 * enforced by test 3. A violating site that is NOT here fails outright, so a new
 * entry cannot quietly join the club. A row here whose site now SATISFIES the
 * rule also fails, naming the row to delete, so the table cannot rot into a
 * permanent excuse.
 *
 * `frozen` is the phase the layer is stranded on - one number where the site
 * resolves statically, and one per declared knob value where it does not.
 */
type KnownViolation = {
  readonly entry: string;
  readonly event: EventName;
  /** The `glpfs` call as it appears in the source, tokens and all. */
  readonly glpfs: string;
  /** The `glt` that pairs with it. */
  readonly glt: string;
  /** Where the layer is stranded, and at which knob value if it varies. */
  readonly frozen: string;
  readonly closedBy: string;
};

const KNOWN_VIOLATIONS: readonly KnownViolation[] = [
  // EMPTY, AND THAT IS THE POINT. Plan 11-01 opened this table with five rows -
  // euclid.timer, ghost.timer, morph.setup, sonar.timer and chorus.setup - and
  // plan 11-02 closed all five. The type and the tests stay, because the table
  // is the mechanism by which a NEW violation is admitted deliberately rather
  // than discovered later, and a mechanism deleted the day it empties is a
  // mechanism that has to be reinvented by whoever next needs it.
];

// ---------------------------------------------------------------------------
// The scanner
// ---------------------------------------------------------------------------

/** One `glpfs` or `glt` call, with its arguments split at depth 0. */
type Call = {
  readonly name: string;
  readonly args: readonly string[];
  readonly index: number;
  readonly text: string;
};

/**
 * Split a call's argument list at commas that sit outside every bracket, so
 * `glpfs(a,2,math.max(x,y),4,0)` yields five arguments and not six.
 *
 * Returns null when the parentheses do not close, which is a malformed source
 * rather than a passing site - the caller turns it into a failure.
 */
function callAt(text: string, open: number, name: string): Call | null {
  const args: string[] = [];
  let depth = 0;
  let start = open + 1;
  for (let i = open; i < text.length; i += 1) {
    const c = text[i];
    if (c === "(" || c === "[" || c === "{") depth += 1;
    else if (c === ")" || c === "]" || c === "}") {
      depth -= 1;
      if (depth === 0) {
        args.push(text.slice(start, i));
        return {
          name,
          args: args.map(normalise),
          index: open,
          text: name + text.slice(open, i + 1),
        };
      }
    } else if (c === "," && depth === 1) {
      args.push(text.slice(start, i));
      start = i + 1;
    }
  }
  return null;
}

/** Whitespace out. Two spellings of one expression must compare equal. */
function normalise(text: string): string {
  return text.replace(/\s+/g, "");
}

/** Every call to `name` in `text`, in source order. */
function callsTo(text: string, name: string): Call[] {
  const out: Call[] = [];
  const needle = name + "(";
  let at = text.indexOf(needle);
  while (at !== -1) {
    const before = at === 0 ? "" : text[at - 1];
    // A name preceded by an identifier character is a different name.
    if (!/[A-Za-z0-9_.:]/.test(before)) {
      const call = callAt(text, at + name.length, name);
      if (call !== null) out.push(call);
    }
    at = text.indexOf(needle, at + 1);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The evaluator
// ---------------------------------------------------------------------------

const TOKEN = /@[A-Z][A-Z0-9_]*/g;

/**
 * Evaluate a Lua integer expression built only from decimal literals, `+`, `-`,
 * `*`, `//`, `%` and parentheses. Anything else - an identifier, a `math.` call,
 * a string - returns null, which the caller reads as "computed at run time".
 *
 * `//` is Lua's floor division and `%` its floor modulo, and both are
 * implemented as floor rather than truncation because that is what the firmware
 * VM does for the negative operands an author can produce.
 */
function evalInt(expression: string): number | null {
  const source = normalise(expression);
  if (source === "" || !/^[0-9+\-*/%()]+$/.test(source)) return null;

  let at = 0;
  const peek = () => source[at];

  function parseExpression(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = source[at];
      at += 1;
      const right = parseTerm();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number | null {
    let left = parseUnary();
    if (left === null) return null;
    for (;;) {
      if (source.startsWith("//", at)) {
        at += 2;
        const right = parseUnary();
        if (right === null || right === 0) return null;
        left = Math.floor(left / right);
      } else if (peek() === "*") {
        at += 1;
        const right = parseUnary();
        if (right === null) return null;
        left = left * right;
      } else if (peek() === "%") {
        at += 1;
        const right = parseUnary();
        if (right === null || right === 0) return null;
        left = left - Math.floor(left / right) * right;
      } else if (peek() === "/") {
        // Lua's float division. A decay constant written with it is not an
        // integer and this gate refuses to guess what firmware rounds it to.
        return null;
      } else {
        return left;
      }
    }
  }

  function parseUnary(): number | null {
    if (peek() === "-") {
      at += 1;
      const inner = parseUnary();
      return inner === null ? null : -inner;
    }
    if (peek() === "+") {
      at += 1;
      return parseUnary();
    }
    if (peek() === "(") {
      at += 1;
      const inner = parseExpression();
      if (inner === null || peek() !== ")") return null;
      at += 1;
      return inner;
    }
    const digits = /^[0-9]+/.exec(source.slice(at));
    if (digits === null) return null;
    at += digits[0].length;
    return Number.parseInt(digits[0], 10);
  }

  const value = parseExpression();
  return value === null || at !== source.length ? null : value;
}

/** Substitute one knob assignment into an expression. */
function substitute(
  expression: string,
  assignment: Readonly<Record<string, string>>,
): string {
  return expression.replace(TOKEN, (token) =>
    Object.prototype.hasOwnProperty.call(assignment, token)
      ? "(" + assignment[token] + ")"
      : token,
  );
}

function tokensIn(expression: string): string[] {
  return [...new Set(expression.match(TOKEN) ?? [])];
}

function knobFor(entry: CatalogEntry, token: string): LuaKnob | undefined {
  return entry.knobs.find((knob) => knob.token === token);
}

/** Every assignment of the given tokens from their knobs' declared values. */
function assignments(
  entry: CatalogEntry,
  tokens: readonly string[],
): Record<string, string>[] {
  let out: Record<string, string>[] = [{}];
  for (const token of tokens) {
    const knob = knobFor(entry, token);
    if (knob === undefined) return [];
    const next: Record<string, string>[] = [];
    for (const base of out) {
      for (const value of knob.values) next.push({ ...base, [token]: value });
    }
    out = next;
  }
  return out;
}

// ---------------------------------------------------------------------------
// The pairing
// ---------------------------------------------------------------------------

type Site = {
  readonly entry: CatalogEntry;
  readonly event: EventName;
  readonly glpfs: Call;
  readonly glt: Call;
  readonly cell: string;
  readonly layer: string;
  readonly start: string;
  readonly rate: string;
  readonly timeout: string;
  readonly tokens: readonly string[];
};

/**
 * Every decaying `glpfs` in one event, paired with the `glt` that schedules it.
 *
 * The pair is the NEXT `glt` after the `glpfs` naming the same cell expression
 * AND the same layer expression. Both halves matter: STEPS writes
 * `glpfs(a,1,...)` and later an unrelated `glt(a,1,65535)` on a different
 * branch, and MORPH writes `glt(a,L,65535)` beside a layer-2 decay.
 */
function sitesIn(entry: CatalogEntry, event: EventName): Site[] {
  if (entry.source.kind !== "lua") return [];
  const text = entry.source[event];
  if (text === "") return [];

  const glts = callsTo(text, "glt");
  const out: Site[] = [];

  for (const glpfs of callsTo(text, "glpfs")) {
    if (glpfs.args.length !== 5) {
      throw new Error(
        `${entry.id}.${event}: ${glpfs.text} does not take five arguments, ` +
          "so this gate cannot read it. See this file's header.",
      );
    }
    const [cell, layer, start, rate, shape] = glpfs.args;
    // A shaped write is a keeper, not a decay. See section 4 of the header.
    if (shape !== "0") continue;
    // A rate of 0 does not walk at all - it writes one phase and holds it, and
    // it is how an entry takes a cell BACK from a decay it started earlier
    // (`life.ts` did exactly this, in its live branch). There is no landing to
    // check because nothing moves.
    if (rate === "0") continue;

    const glt = glts.find(
      (candidate) =>
        candidate.index > glpfs.index &&
        candidate.args.length === 3 &&
        candidate.args[0] === cell &&
        candidate.args[1] === layer,
    );
    if (glt === undefined) {
      throw new Error(
        `${entry.id}.${event}: ${glpfs.text} starts a decay on cell "${cell}" ` +
          `layer "${layer}" and no glt on that cell and layer follows it, so ` +
          "nothing ever stops it. See this file's header.",
      );
    }
    if (glt.args[2] === "0") continue;

    out.push({
      entry,
      event,
      glpfs,
      glt,
      cell,
      layer,
      start,
      rate,
      timeout: glt.args[2],
      tokens: [
        ...new Set([
          ...tokensIn(start),
          ...tokensIn(rate),
          ...tokensIn(glt.args[2]),
        ]),
      ],
    });
  }
  return out;
}

function allSites(): Site[] {
  const out: Site[] = [];
  for (const entry of CATALOG) {
    if (entry.source.kind !== "lua") continue;
    for (const event of EVENTS) out.push(...sitesIn(entry, event));
  }
  return out;
}

/**
 * Does the timeout DERIVE from the start, in GRIDLOCK's computed shape?
 *
 * `glpfs(a,l,p,R,0)` plus `glt(a,l,(256-p)//R)` lands on 0 for every `p` that R
 * divides, so a site of that shape is accepted WITHOUT resolving `p`. CHORUS's
 * bloom is the one shipped site of this shape, brought into it by 11-02;
 * GRIDLOCK held the role before 11-01 deleted it.
 *
 * WHAT THIS ARM CANNOT SEE, said plainly because accepting a site without
 * resolving it is a real weakening: that every value `p` can take really is a
 * multiple of R. That guarantee is owed by the ENTRY, in its own source, and
 * CHORUS discharges it by rounding the distance term down to a multiple of four
 * and clamping with glim.
 */
function derivesTimeout(site: Site): boolean {
  return (
    site.timeout === normalise("(256-" + site.start + ")//" + site.rate) ||
    site.timeout === normalise("(256-(" + site.start + "))//" + site.rate)
  );
}

/** The freeze point, or null when an operand is computed at run time. */
function frozenPhase(
  start: string,
  rate: string,
  timeout: string,
): number | null {
  const s = evalInt(start);
  const r = evalInt(rate);
  const t = evalInt(timeout);
  if (s === null || r === null || t === null) return null;
  return (((s + r * t) % 256) + 256) % 256;
}

function recorded(site: Site): KnownViolation | undefined {
  return KNOWN_VIOLATIONS.find(
    (row) =>
      row.entry === site.entry.id &&
      row.event === site.event &&
      normalise(row.glpfs) === site.glpfs.text &&
      normalise(row.glt) === site.glt.text,
  );
}

/** The rule, first. The arithmetic, second. Never the other way round. */
function violationMessage(site: Site, detail: string): string {
  return (
    "A DECAYING LAYER MUST LAND ON PHASE 0. " +
    `${site.entry.id}.${site.event} writes ${site.glpfs.text} with ` +
    `${site.glt.text}, and ${detail}. A layer that freezes above 0 stays lit ` +
    "forever with no Timer coming back to clear it - which is what the bench " +
    "reported as a stuck colour. See this file's header."
  );
}

// ---------------------------------------------------------------------------

describe("the decay idiom", () => {
  it("1. every literal decay pair lands on phase 0", () => {
    const sites = allSites().filter((site) => site.tokens.length === 0);
    expect(
      sites.length,
      "the scanner found literal decay pairs to check",
    ).toBeGreaterThan(0);

    const problems: string[] = [];
    for (const site of sites) {
      if (derivesTimeout(site)) continue;
      const frozen = frozenPhase(site.start, site.rate, site.timeout);
      const row = recorded(site);

      if (frozen === null) {
        if (row === undefined) {
          problems.push(
            violationMessage(
              site,
              "its starting phase is computed at run time while its timeout is " +
                "fixed, so where it freezes cannot be known and is not 0 in " +
                "general; the computed form derives the timeout from the phase",
            ),
          );
        }
        continue;
      }
      if (frozen !== 0 && row === undefined) {
        problems.push(
          violationMessage(
            site,
            `it starts at ${site.start}, steps by ${(256 - Number(evalInt(site.rate))) % 256} ` +
              `and freezes at ${frozen} after ${site.timeout} ticks`,
          ),
        );
      }
    }

    expect(problems.join("\n\n"), "unrecorded literal decay violations").toBe(
      "",
    );
  });

  it("2. every declared value of a parameterised decay lands on phase 0", () => {
    const sites = allSites().filter((site) => site.tokens.length > 0);
    expect(
      sites.length,
      "the scanner found parameterised decay pairs to check",
    ).toBeGreaterThan(0);

    const problems: string[] = [];
    for (const site of sites) {
      if (derivesTimeout(site)) continue;
      const row = recorded(site);
      const combinations = assignments(site.entry, site.tokens);
      expect(
        combinations.length,
        `${site.entry.id}.${site.event}: every token in ${site.glpfs.text} ` +
          `and ${site.glt.text} resolves to a declared knob`,
      ).toBeGreaterThan(0);

      const bad: string[] = [];
      for (const assignment of combinations) {
        const frozen = frozenPhase(
          substitute(site.start, assignment),
          substitute(site.rate, assignment),
          substitute(site.timeout, assignment),
        );
        const label = site.tokens
          .map((token) => `${token}=${assignment[token]}`)
          .join(", ");
        if (frozen === null) {
          bad.push(`${label} -> computed at run time, so never provably 0`);
        } else if (frozen !== 0) {
          bad.push(`${label} -> freezes at ${frozen}`);
        }
      }

      // EVERY failing value is reported, never only the first.
      if (bad.length > 0 && row === undefined) {
        problems.push(
          violationMessage(
            site,
            `${bad.length} of its ${combinations.length} declared knob ` +
              `settings do not: ${bad.join("; ")}`,
          ),
        );
      }
    }

    expect(
      problems.join("\n\n"),
      "unrecorded parameterised decay violations",
    ).toBe("");
  });

  it("3. KNOWN_VIOLATIONS is exhaustive and shrinking", () => {
    const sites = allSites();
    const problems: string[] = [];

    // Shrinking: a row whose site now passes, or whose site is gone.
    for (const row of KNOWN_VIOLATIONS) {
      const site = sites.find((candidate) => recorded(candidate) === row);
      if (site === undefined) {
        problems.push(
          `KNOWN_VIOLATIONS carries ${row.entry}.${row.event} ` +
            `${row.glpfs} + ${row.glt}, which is no longer in the catalog. ` +
            "Delete the row - this table only ever shrinks.",
        );
        continue;
      }
      const tokens = site.tokens;
      const combinations =
        tokens.length === 0 ? [{}] : assignments(site.entry, tokens);
      const everyOneLands =
        !derivesTimeout(site) &&
        combinations.length > 0 &&
        combinations.every(
          (assignment) =>
            frozenPhase(
              substitute(site.start, assignment),
              substitute(site.rate, assignment),
              substitute(site.timeout, assignment),
            ) === 0,
        );
      if (everyOneLands || derivesTimeout(site)) {
        problems.push(
          `KNOWN_VIOLATIONS carries ${row.entry}.${row.event} ` +
            `${row.glpfs} + ${row.glt}, and it now satisfies the rule. ` +
            `Delete the row (closedBy: ${row.closedBy}) - a fixed site left ` +
            "in this table turns it into a permanent excuse.",
        );
      }
    }

    // Exhaustive: no two rows may name one site, and every row is complete.
    const seen = new Set<string>();
    for (const row of KNOWN_VIOLATIONS) {
      const key = `${row.entry}.${row.event}.${normalise(row.glpfs)}`;
      if (seen.has(key)) problems.push(`KNOWN_VIOLATIONS names ${key} twice.`);
      seen.add(key);
      if (row.frozen === "" || row.closedBy === "") {
        problems.push(
          `KNOWN_VIOLATIONS row ${key} is missing its frozen phase or its ` +
            "closedBy plan. A row without both is an excuse, not a record.",
        );
      }
    }

    expect(problems.join("\n\n"), "the violations table is honest").toBe("");

    // The record itself, printed so a reader of a green run still sees it.
    // 11-01 printed five rows here; 11-02 closed all five, so what a green run
    // now prints is the empty roll and that is the record.
    const roll = KNOWN_VIOLATIONS.map(
      (row) =>
        `${row.entry}.${row.event}: ${row.glpfs} + ${row.glt} freezes at ` +
        `${row.frozen} (closed by ${row.closedBy})`,
    ).join("\n");
    expect(roll, "no open class-A site is on the record").toBe("");
    expect(KNOWN_VIOLATIONS.length, "the open class-A sites").toBe(0);

    // AND THE NON-VACUITY HALF, so an empty table cannot make this file a
    // no-op. Tests 1 and 2 assert their site counts are above zero, and this
    // asserts the same thing from the other side: with nothing excused, every
    // decay site in the catalog is being CHECKED rather than merely counted.
    const checked = sites.filter((site) => recorded(site) === undefined);
    expect(
      checked.length,
      "every decay site in the catalog is checked, none excused",
    ).toBe(sites.length);
    expect(sites.length, "there are decay sites to check").toBeGreaterThan(0);
  });
});
