// MIX TWO's crossover: two candidates in, four results out (TUNE-04, T4).
//
// `child[k] = coin() ? a[k] : b[k]`, with one mutation: a single
// `surpriseIndices` draw on one knob that is not held. That is the whole
// algorithm, and the smallness is the point - the state model on both routes is
// already an index vector, so crossover is a per-key choice and nothing else.
//
// PURE AND INJECTABLE, EXACTLY AS surprise.ts IS. `rng` is an argument with NO
// DEFAULT, which is deliberate and is a stricter rule than surprise.ts's:
// `surpriseIndices` may fall back to Math.random because it predates T4, and
// this module is named by a COMPONENT. 10-11's verification greps
// `src/lib/ui/` and this file for `Math.random` and expects nothing, so the
// randomness a visitor sees is the randomness a test can seed. It also means
// the property below is a property rather than a demonstration.
//
// THIS MODULE IMPORTS NOTHING AT RUN TIME EXCEPT surprise.ts, WHICH ALSO
// IMPORTS NOTHING. `KnobDescriptor` arrives as a type and is erased. So
// MixTwo.svelte may name this module statically without pulling the vendored
// compiler - or its 131 KB of protocol - onto the front door's first paint,
// which is D-18's rule and the one tune-ui.spec.ts's first test holds.
//
// ZERO NEW REACHABLE STATES, AND THAT IS WHY THERE IS NO `fits` ARGUMENT HERE.
// Every child is componentwise one of two parents' positions, except at one
// knob where it is a fresh draw from that knob's own options - so every child
// is a point in the space `reachability.sweep.spec.ts` Pass A already sweeps,
// where the measured over-budget count is ZERO (10-08: 19,502 / 24,576 /
// 44,078 states, 0 over budget). The mutation therefore hands `surpriseIndices`
// the constant-true predicate a Lua entry already gets, and the plan re-runs
// the sweep afterwards to reproduce those totals exactly. A moved total would
// mean a child fell outside an option range, which is the cheapest possible
// proof that this module invented nothing.
//
// HELD KNOBS ARE NEVER CROSSED AND NEVER MUTATED (T1, 10-UI-SPEC 11.5). A held
// knob takes `a`'s position unchanged, and the mutation's domain is one knob
// drawn from the UNHELD ones - expressed by handing `surpriseIndices` a `held`
// set of "everything except the one", which is that function's own documented
// domain-narrowing rather than a second mechanism. Lock the colour you love,
// mix everything else.
//
// AND THE DEGENERATE CASE IS A RESULT RATHER THAN AN ACCIDENT. With every knob
// held there is no knob to cross and none to mutate, so all four children are
// `a`. The caller disables the control rather than offering four copies of the
// state the visitor is already in - the same shape `SURPRISE ME` takes when
// `surpriseIndices` signals exhaustion.
//
// NO GENETICS METAPHOR REACHES THE INTERFACE (A-15). It does not reach these
// identifiers either, beyond `child`, which the copy contract explicitly
// permits as an identifier and forbids as user-facing text: copy.spec.ts scans
// every string this site's copy module can produce for `breed`, `parent`,
// `mutate`, `DNA`, `gene`, `genetic`, `offspring` and `child`.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { KnobDescriptor } from "./knobs.preset";
import { surpriseIndices } from "./surprise";

/**
 * Four results, and the number is a contract rather than a parameter.
 *
 * 10-UI-SPEC 11.6 says four, the accessibility contract says four real
 * buttons, and the canvas budget is counted as hero + the picker's one result
 * + FOUR. A caller that could ask for six would move all three at once.
 */
export const MIX_CHILDREN = 4;

/** A position a knob can actually stand at: an integer inside its own list. */
function standsAt(knob: KnobDescriptor, at: number | undefined): boolean {
  return (
    typeof at === "number" &&
    Number.isInteger(at) &&
    at >= 0 &&
    at < knob.options.length
  );
}

/**
 * One parent's position for one knob, or that knob's default.
 *
 * A parent is not always this page's own rack: `THAT ONE` may be a PASTED
 * LINK, and although `decodeFor` refuses a stamp whose payload this entry's
 * knobs cannot reproduce, the refusal is the caller's to act on. Reading a
 * position through this function means a child can never carry an index
 * outside its knob's options WHATEVER a parent turns out to hold - which is
 * the "zero new reachable states" claim made true by construction rather than
 * by trusting the two callers upstream.
 */
function positionOf(
  knob: KnobDescriptor,
  parent: Readonly<Record<string, number>>,
): number {
  const at = parent[knob.id];
  return standsAt(knob, at) ? at : knob.default;
}

/**
 * The one mutation: a single `surpriseIndices` draw on one knob that is free.
 *
 * `everythingElse` is every OTHER knob's id, held or not, so the draw's domain
 * is exactly one knob. That is `surpriseIndices`'s own documented behaviour -
 * "held knobs shrink the domain and nothing else" - rather than a second
 * randomiser, which is what keeps one roll implementation on the site.
 *
 * Two consequences worth naming, both of them `surpriseIndices`'s:
 *
 *   - a draw that reproduces the position it replaced is rejected and rolled
 *     again, up to the twelve-draw bound, so the mutation visibly moves
 *     something whenever the knob has somewhere to move to;
 *   - on a TWO-option knob the bound can genuinely be burned, and the answer
 *     is the previous indices unchanged - the child is then pure crossover
 *     with no mutation, which is why the property below says AT MOST one
 *     mutated position rather than exactly one.
 */
function mutateOne(
  child: Record<string, number>,
  knobs: readonly KnobDescriptor[],
  free: readonly KnobDescriptor[],
  rng: () => number,
): Record<string, number> {
  const at = Math.min(
    free.length - 1,
    Math.max(0, Math.floor(rng() * free.length)),
  );
  const one = free[at];
  const everythingElse = new Set(
    knobs.map((knob) => knob.id).filter((id) => id !== one.id),
  );
  // Constant true: see the header. Every position this can draw is inside the
  // knob's own options, and the sweep has already costed all of them.
  return surpriseIndices(knobs, child, () => true, rng, everythingElse);
}

/**
 * Four children of two candidates, as index vectors.
 *
 * Per child, per knob: a held knob takes `a`'s position unchanged; every other
 * knob takes `a`'s or `b`'s on a coin. Then one unheld knob takes a single
 * `surpriseIndices` draw. Nothing here compiles, nothing here measures and
 * nothing here reaches a device - the four vectors are candidates the caller
 * may render and may throw away, and the current state survives until one of
 * them is taken.
 *
 * `rng` is called a fixed number of times per child - once per unheld knob for
 * the coin, then once to choose the knob to redraw, then `surpriseIndices`'s
 * own draws - so a seeded run is reproducible and a test can count them.
 */
export function mixIndices(
  a: Readonly<Record<string, number>>,
  b: Readonly<Record<string, number>>,
  held: ReadonlySet<string>,
  knobs: readonly KnobDescriptor[],
  rng: () => number,
): Record<string, number>[] {
  const free = knobs.filter((knob) => !held.has(knob.id));
  const children: Record<string, number>[] = [];

  for (let n = 0; n < MIX_CHILDREN; n++) {
    const child: Record<string, number> = {};
    for (const knob of knobs) {
      const mine = positionOf(knob, a);
      if (held.has(knob.id)) {
        child[knob.id] = mine;
        continue;
      }
      // The coin is spent whichever way it lands, so the draw sequence does
      // not depend on whether the other candidate could be read.
      const theirs = b[knob.id];
      child[knob.id] =
        rng() < 0.5 || !standsAt(knob, theirs) ? mine : (theirs as number);
    }
    // Every knob held: nothing to cross, nothing to redraw, four copies of the
    // state the visitor is already in. Asserted rather than left to happen.
    children.push(
      free.length === 0 ? child : mutateOne(child, knobs, free, rng),
    );
  }

  return children;
}
