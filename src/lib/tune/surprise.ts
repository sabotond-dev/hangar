// SURPRISE ME's roll: a fresh index for every knob, re-rolled until it fits.
//
// PURE AND INJECTABLE, which is the whole design. `rng` and `fits` are
// arguments, so the property test is deterministic and the bound is reachable
// without a compiler that lies. This module imports nothing at run time - a
// type and nothing else - so it costs no chunk anywhere and can be exercised
// two thousand times per entry without instantiating a thing.
//
// MEASURED: IT NEVER LOOPS. Over 1,080 kind combinations and 16,645 knob
// combinations across the nine shelf cards, nothing this compiler can produce is
// over 908, and every Lua entry was proven in budget across its whole knob
// cross-product at build time in Phase 8. The bound and the ladder fallback are
// correct defensive code for a compiler that changes - a vendored re-sync, or
// Phase 7 passing reserved characters for an install marker, would move every
// number - and not a hot path. See 05-VALIDATION, the unreachability finding.
//
// WHERE THIS FUNCTION STOPS AND model.ts STARTS. `surpriseIndices` signals
// exhaustion by returning the PREVIOUS indices unchanged. It does not apply the
// fit ladder, because it has no compiler: `model.ts` owns `fitState` and applies
// the ladder-resolved state when it sees the exhaustion signal. That split is
// stated in both files so neither grows the other's job.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { KnobDescriptor } from "./knobs.preset";

/**
 * How many draws a roll may make before it gives up and hands the state back.
 *
 * Twelve, and the number is a comfort rather than a constraint: measured, the
 * first draw always fits. It exists so that a compiler which one day refuses
 * everything stops the loop instead of freezing the panel.
 */
export const SURPRISE_ROLL_LIMIT = 12;

/**
 * The UI spec's budget for the whole gesture: if the roll has not landed inside
 * this, the ladder-resolved state is applied instead. Declared here beside the
 * bound it belongs with; the clock that enforces it is the caller's.
 */
export const SURPRISE_BUDGET_MS = 400;

/**
 * Draw a fresh index for every knob and re-roll until the result fits.
 *
 * A draw that reproduces the state it replaced is rejected WITHOUT being
 * offered to `fits` and rolled again, so SURPRISE ME visibly does something. For
 * a Lua entry every draw fits by construction and `fits` is the constant true,
 * so the roll is one pass.
 *
 * Returns `previous` unchanged when the bound is reached - the exhaustion
 * signal the caller resolves with the fit ladder.
 */
export function surpriseIndices(
  knobs: readonly KnobDescriptor[],
  previous: Readonly<Record<string, number>>,
  fits: (indices: Record<string, number>) => boolean,
  rng: () => number = Math.random,
): Record<string, number> {
  const held = { ...previous };
  if (knobs.length === 0) return held;

  for (let roll = 0; roll < SURPRISE_ROLL_LIMIT; roll++) {
    const draw: Record<string, number> = {};
    let moved = false;
    for (const knob of knobs) {
      const at = Math.min(
        knob.options.length - 1,
        Math.max(0, Math.floor(rng() * knob.options.length)),
      );
      draw[knob.id] = at;
      if (at !== held[knob.id]) moved = true;
    }
    // The same state again is not a surprise. It costs a roll and no compile.
    if (!moved) continue;
    if (fits(draw)) return draw;
  }

  return held;
}
