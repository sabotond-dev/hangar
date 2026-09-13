// The class-B gate's scanner: the fast-tap needles, in one place, moved here
// from touch-guard.spec.ts at 13-14 verbatim so the Sandbox's emitter and the
// touch library can be held to the same two rules without a third copy. EVERY
// NEEDLE IS ASSEMBLED FROM FRAGMENTS AT RUN TIME: the gate's prose and failure
// messages necessarily contain the text it forbids, and a gate that matches its
// own source is a gate nobody can edit; the fragments are exported so a caller
// builds its messages the same way. The convention, one line each:
//   this contact ENDED   -> e == 3 or e >= 5 and e < 9   (`endedEscapes`)
//   this contact STARTED -> e == 4 or e > 8              (`startedAdmits`)
//   this contact is LIVE -> if e ~= 1 and e ~= 4 and e < 9 then return end
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** Assembled at run time, never written out: a gate that matches its own source is a gate nobody can edit. */
export const F = (...parts: string[]): string => parts.join("");

// The pieces every needle and every message is built from.
export const V = "e";
export const EQ = F("=", "=");
const NE = F("~", "=");
export const GE = F(">", "=");
export const GT = ">";
export const LT = "<";
export const AND = F("an", "d");
export const OR = F("o", "r");

/** One comparison of the event code against a literal. */
export type Comparison = {
  readonly op: string;
  readonly value: number;
  readonly at: number;
  readonly end: number;
};

/** A run of comparisons joined only by `and` / `or` and brackets. */
export type Chain = {
  readonly members: readonly Comparison[];
  /** The connective before members[i], for i >= 1. */
  readonly joins: readonly string[];
  readonly at: number;
  readonly end: number;
};

const NAME_CHAR = /[A-Za-z0-9_]/;

const COMPARISON = new RegExp(
  F(
    V,
    "\\s*(",
    EQ,
    "|",
    NE,
    "|",
    GE,
    "|",
    F(LT, "="),
    "|",
    GT,
    "|",
    LT,
    ")\\s*([0-9]+)",
  ),
  "g",
);

const JOIN = new RegExp(F("^[\\s()]*(", AND, "|", OR, ")[\\s()]*$"));

/** Every event-code comparison in one body, in source order. */
export function comparisonsIn(text: string): Comparison[] {
  const out: Comparison[] = [];
  COMPARISON.lastIndex = 0;
  for (;;) {
    const match = COMPARISON.exec(text);
    if (match === null) break;
    const at = match.index;
    // `mode==4` is a different name, not the event code.
    if (at > 0 && NAME_CHAR.test(text[at - 1])) continue;
    out.push({
      op: match[1],
      value: Number.parseInt(match[2], 10),
      at,
      end: at + match[0].length,
    });
  }
  return out;
}

/** Group consecutive comparisons into chains. */
export function chainsOf(
  text: string,
  comparisons: readonly Comparison[],
): Chain[] {
  const out: Chain[] = [];
  let members: Comparison[] = [];
  let joins: string[] = [];
  const flush = (): void => {
    if (members.length === 0) return;
    out.push({
      members,
      joins,
      at: members[0].at,
      end: members[members.length - 1].end,
    });
    members = [];
    joins = [];
  };
  for (const comparison of comparisons) {
    if (members.length === 0) {
      members.push(comparison);
      continue;
    }
    const between = text.slice(members[members.length - 1].end, comparison.at);
    const join = JOIN.exec(between);
    if (join === null) {
      flush();
      members.push(comparison);
      continue;
    }
    joins.push(join[1]);
    members.push(comparison);
  }
  flush();
  return out;
}

/**
 * The `if` or `elseif` clause a chain sits in, from the keyword to the end of
 * the chain. This is what a DECLARED_EXCEPTIONS row is keyed on, so that moving
 * a correct-in-context guard somewhere it is wrong stops being excused.
 */
export function branchOf(text: string, chain: Chain): string {
  const before = text.slice(0, chain.at);
  const shortKeyword = before.lastIndexOf(F("if", " "));
  const longKeyword = before.lastIndexOf(F("else", "if", " "));
  let start = shortKeyword;
  if (longKeyword !== -1 && longKeyword + 4 === shortKeyword)
    start = longKeyword;
  if (start === -1) start = chain.at;
  return text.slice(start, chain.end);
}

export const is = (c: Comparison, op: string, value: number): boolean =>
  c.op === op && c.value === value;

/** A chain that tests membership of a live contact, never an onset. */
export const isLiveTest = (chain: Chain): boolean =>
  chain.members.some((c) => is(c, EQ, 1) || is(c, NE, 1));

/** True when member `i` opens a "contact ended" test (`e>=5` or `e>4`). */
export const isEndedOpener = (c: Comparison): boolean =>
  is(c, GE, 5) || is(c, GT, 4);

/**
 * Rule 1: an "ended" opener at member `i` escapes the fast tap when the next
 * member is `and e<9`.
 */
export function endedEscapes(chain: Chain, i: number): boolean {
  const next = chain.members[i + 1];
  const joined = chain.joins[i];
  return typeof next !== "undefined" && joined === AND && is(next, LT, 9);
}

/** True when a chain decides an onset: it names `e==4` and is not a live test. */
export const isOnsetChain = (chain: Chain): boolean =>
  !isLiveTest(chain) && chain.members.some((c) => is(c, EQ, 4));

/** Rule 2: an onset chain admits the fast tap when it also names 9. */
export const startedAdmits = (chain: Chain): boolean =>
  chain.members.some((c) => is(c, GT, 8) || is(c, EQ, 9) || is(c, GE, 9));

/** The chains of one body. */
export const scan = (text: string): Chain[] =>
  chainsOf(text, comparisonsIn(text));
