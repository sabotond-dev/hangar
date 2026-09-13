// The Sandbox's undo and redo: a history over STRUCTURAL edits of one surface
// (place, delete, move, resize, rename, retype, duplicate, recolour, MIDI,
// orientation, latch). Selection and mode are not entries. An entry holds the
// surface before and after, both immutable values, and the region to re-select.
// THE COALESCING BOUNDARY: a numeric field's keystrokes are ONE entry - an edit
// under a coalesce key replaces the open entry's `after` until seal() (blur,
// commit, an edit under another key, undo or redo); by key and recency, never
// by time. Only validated surfaces are pushed. This is not the Playground's
// `Undo randomize` (TuningRegion.svelte, one stored vector, one click back).
// Decided at 13-16 (the boundary); see .planning/phases/13-gui-overhaul/13-16-SUMMARY.md
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
  /** The key this entry coalesces under, or undefined for a one-shot edit. */
  readonly key: string | undefined;
};

/** What undo or redo hands back: the surface to restore, and the region to select. */
export type HistoryStep = {
  readonly surface: Surface;
  readonly select: string | undefined;
};

/** The coalesce key of a numeric field's keystrokes. */
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
   * open under the same key, the edit merges into it; otherwise it
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

  /** The coalescing boundary: the next edit under the same key is a new entry. */
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
