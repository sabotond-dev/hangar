// Every knob write in this phase, funnelled through one function.
//
// `withChange` below is a COPY of a module-private function in the vendored
// compiler (`src/vendor/botor/_pad.ts:3156`). It is copied rather than
// imported because `src/vendor/` is read-only in this repository (D-04): a
// vendored file may not gain an `export` keyword, because the next re-sync
// from BOTOR would silently drop it and the diff would look like nothing at
// all. Copying five lines and saying so is the honest version of that
// constraint.
//
// WHY DELETING `preset` IS LOAD-BEARING, not tidiness. `encodeStamp` returns
// the short form `p<presetId>` for any state whose `preset` field is set
// (`_pad.ts:2632`). A tuned state that kept its shelf card would therefore
// encode as the UNTUNED card: the shared link would open, would look correct,
// and would silently throw away every knob the visitor moved. `soloStream`
// goes for the neighbouring reason - it is audition-only state that the
// compiler already refuses to encode, and it must not survive into a
// measurement either.
//
// This module imports the vendored compiler and is therefore on the model side
// of D-18. No Svelte component may name it; wave 4's model.ts is the seam a
// component reaches, and only through `await import()`.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  clonePadState,
  groundPadState,
  type PadState,
} from "../../vendor/botor/_pad";
import { presetById } from "../catalog/presets";
import type { CatalogEntry } from "../catalog/types";

/**
 * The vendored `withChange`, reimplemented (see the module comment for both
 * halves of why). Clone, edit the draft, drop the shelf card and the audition,
 * and ground the result so what is measured is what would really be written.
 */
export function withChange(
  s: PadState,
  change: (draft: PadState) => void,
): PadState {
  const draft = clonePadState(s);
  change(draft);
  delete draft.preset;
  delete draft.soloStream;
  return groundPadState(draft);
}

/**
 * The half of a knob that moves a `PadState`: how to write an index into the
 * state, and how to read one back out of it.
 *
 * Declared here rather than in knobs.preset.ts so that this module never
 * imports the descriptor tables - the dependency runs one way, from the tables
 * to the plumbing, and a spec can exercise the plumbing with a fixture knob.
 */
export type KnobBinding = {
  /** Always through `withChange`, never a direct mutation. */
  apply(state: PadState, index: number): PadState;
  /** The inverse of `apply`. Clamps to 0 when the state matches no option. */
  read(state: PadState): number;
};

/**
 * Move one knob. Thin on purpose: it delegates to the knob's own binding.
 *
 * It exists so that every knob write in the phase goes through one named
 * function, which is what makes "route every knob write through withChange"
 * checkable by grep rather than by review.
 */
export function applyKnob(
  state: PadState,
  knob: KnobBinding,
  index: number,
): PadState {
  return knob.apply(state, index);
}

/** Read one knob's current index out of a state. The inverse of applyKnob. */
export function readKnob(state: PadState, knob: KnobBinding): number {
  return knob.read(state);
}

/**
 * Thrown by `baseStateFor` for a Lua entry. A Lua configuration is two strings
 * and a token table; it has no `PadState` and never will, so asking for one is
 * a programming error rather than a runtime condition - and a named error says
 * which entry was asked for instead of handing back a plausible default card.
 */
export class NoPadStateError extends Error {
  constructor(entryId: string) {
    super(
      `${entryId} is a Lua entry: it has no PadState. Use its knob tokens instead.`,
    );
    this.name = "NoPadStateError";
  }
}

/**
 * The starting `PadState` for a catalog entry: the shelf card's own state for
 * a `preset` entry, the carried state for a `state` entry, and a throw for a
 * `lua` one.
 *
 * The returned state is a CLONE. The vendored `PRESETS` array holds one shared
 * object per card, and a caller that mutated it would poison every later
 * reader on the page.
 */
export function baseStateFor(entry: CatalogEntry): PadState {
  const source = entry.source;
  if (source.kind === "lua") throw new NoPadStateError(entry.id);
  if (source.kind === "state") return clonePadState(source.state);
  const preset = presetById(source.presetId);
  if (!preset) {
    throw new Error(`${entry.id} names no shelf preset: ${source.presetId}`);
  }
  return clonePadState(preset.state);
}

/**
 * RESET ALL: the configuration as published, with the shelf card RESTORED.
 *
 * That last part is the whole point. `withChange` drops `preset` on every edit,
 * so a state that has been tuned and then reset would otherwise stay a field
 * dump and encode as a 13-character stamp that says exactly what `paurora`
 * says. Restoring it means an untouched card is the short form again, and a
 * link to the defaults carries nothing after the hash at all.
 */
export function resetAll(entry: CatalogEntry): PadState {
  const state = baseStateFor(entry);
  if (entry.source.kind === "preset") state.preset = entry.source.presetId;
  return state;
}
