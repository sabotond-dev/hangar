// The Sandbox's undo and redo: a history over STRUCTURAL edits of one surface,
// with the coalescing boundary stated here because it is the rule that makes
// the feature usable rather than annoying.
//
// ---------------------------------------------------------------------------
// 1. WHAT IS AN ENTRY
// ---------------------------------------------------------------------------
//
// One entry is one structural edit of the surface: place, delete, move,
// resize, rename, retype, duplicate, recolour, a MIDI change, an orientation
// or latch change. An entry holds the surface BEFORE and the surface AFTER
// (both immutable values - geometry.ts never mutates, so holding two
// references costs nothing and copies nothing) and the id of the region the
// edit was about, so undoing a placement can re-select what it removed and
// undoing a deletion can re-select what it restored. Selection itself is NOT
// an entry: choosing a region changes nothing on the surface and is not
// something a visitor expects Undo to walk back through. Mode is not an entry
// either - Play locks structure, so it cannot create one, and the switch
// preserves this list untouched (13-16's spec, test 4 and test 6, asserts the
// depth across a round trip).
//
// ---------------------------------------------------------------------------
// 2. THE COALESCING BOUNDARY
// ---------------------------------------------------------------------------
//
// A numeric field's keystrokes are ONE entry. Typing `12` into Width is two
// keystrokes and two valid intermediate surfaces (width 1, then width 12);
// recorded as two entries, one Undo would take the visitor to width 1, which
// is a state they never meant and never saw as final. So an edit may carry a
// COALESCE KEY - `field:{regionId}:{field}` for a numeric field - and while the
// most recent entry is OPEN under the same key, a new edit under that key
// REPLACES its `after` instead of pushing: the entry keeps the `before` from
// the first keystroke and the `after` from the last. The boundary that closes
// the entry - `seal()` - is reached when:
//
//   - focus leaves the field, or the value commits (Enter) - the component
//     calls seal() from its blur and its submit;
//   - any edit under a DIFFERENT key or with no key lands - two different
//     fields are two entries even without a blur between them;
//   - undo or redo runs - a half-typed field is closed by walking away from it.
//
// The coalescing is BY KEY AND BY RECENCY, never by time: a visitor who types
// `1`, thinks for a minute, and types `2` still gets one entry, because no
// clock was consulted. And a REJECTED keystroke never reaches this module at
// all - the editor keeps the previous valid surface in the model (geometry.ts
// rule 5) and only a surface that validated is pushed - so an entry's `after`
// is always a valid surface and Undo can never land on an invalid one.
//
// ---------------------------------------------------------------------------
// 3. WHAT THIS IS NOT: `Undo randomize` (13-10)
// ---------------------------------------------------------------------------
//
// The Playground's inspector has an `Undo randomize` control
// (src/lib/ui/TuningRegion.svelte, UNDO_RANDOMIZE in
// src/lib/tune/inspector-copy.ts). That is ONE stored vector - the knob
// indices a roll replaced - held in component state and handed back in one
// click; a second click finds it cleared, and a hand turn after a roll clears
// it too. Its header says it is explicitly not general undo and points here.
// This module is the other thing: a real past and a real future over a
// different object (a surface, not a knob rack), owned by the Sandbox, and
// walked by Undo and Redo as many times as there are entries. Neither is a
// half of the other, and a reader who finds one should not expect the other's
// shape.
//
// ---------------------------------------------------------------------------
// 4. THE SHAPE
// ---------------------------------------------------------------------------
//
// `past` and `future` are two stacks of entries. `push` clears the future (a
// new edit after an undo is a branch the redo stack cannot describe). `undo`
// and `redo` return the surface to restore and the region to re-select, or
// undefined at the end of the stack. `depth` is `past.length`, which is what
// the spec asserts across the mode round trip. No cap on the length: a
// surface holds at most sixteen regions and an entry is two references.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { Surface } from "./model";

/** The kinds of structural edit, for a reader of the stack (and a test). */
export type EditKind =
  | "place"
  | "delete"
  | "move"
  | "resize"
  | "rename"
  | "retype"
  | "duplicate"
  | "recolour"
  | "midi"
  | "orientation"
  | "latch"
  | "template";

export type HistoryEntry = {
  readonly kind: EditKind;
  readonly before: Surface;
  readonly after: Surface;
  /** The region the edit was about, to re-select on the way back. */
  readonly regionId: string | undefined;
  /** Section 2: the key this entry coalesces under, or undefined for a one-shot edit. */
  readonly key: string | undefined;
};

/** What undo or redo hands back: the surface to restore, and the region to select. */
export type HistoryStep = {
  readonly surface: Surface;
  readonly select: string | undefined;
};

/** The coalesce key of a numeric field's keystrokes (section 2). */
export const fieldKey = (regionId: string, field: string): string =>
  `field:${regionId}:${field}`;

export class History {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  /** True while the most recent entry may still absorb a keystroke under its key. */
  private open = false;

  /** How many entries Undo can walk back through. */
  get depth(): number {
    return this.past.length;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  /** The entries, oldest first - for a reader, never mutated through this. */
  get entries(): readonly HistoryEntry[] {
    return this.past;
  }

  /**
   * Record one structural edit. With `key`, and while the most recent entry is
   * open under the same key, the edit merges into it (section 2); otherwise it
   * seals whatever was open and pushes. Always clears the future.
   */
  push(entry: HistoryEntry): void {
    this.future = [];
    const last = this.past[this.past.length - 1];
    if (
      entry.key !== undefined &&
      this.open &&
      last !== undefined &&
      last.key === entry.key
    ) {
      this.past[this.past.length - 1] = { ...last, after: entry.after };
      return;
    }
    this.past.push(entry);
    this.open = entry.key !== undefined;
  }

  /** The boundary (section 2): the next edit under the same key is a new entry. */
  seal(): void {
    this.open = false;
  }

  undo(): HistoryStep | undefined {
    this.seal();
    const entry = this.past.pop();
    if (entry === undefined) return undefined;
    this.future.push(entry);
    return { surface: entry.before, select: entry.regionId };
  }

  redo(): HistoryStep | undefined {
    this.seal();
    const entry = this.future.pop();
    if (entry === undefined) return undefined;
    this.past.push(entry);
    return { surface: entry.after, select: entry.regionId };
  }
}
