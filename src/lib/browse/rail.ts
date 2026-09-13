// The Playground rail's rows, DERIVED - never typed as a literal. PDF page 2
// draws YOUR LIBRARY (All configs, Favorites, Recently used, each with a count)
// over a divider, then MADE FOR with plain rows. The MADE FOR rows are HANGAR's
// own FOR terms (13-CONTEXT D-11: "the real configuration schema should
// determine"), derived from FOR_TERMS at runtime so a retired or added term
// moves the rail with the vocabulary; browse-ui.spec.ts prints the count it
// observes and nothing here knows the number. Labels are FOR_LABELS
// (./labels.ts); row ids carry a `for:` prefix so a term can never collide with
// the three library rows, and forTermOf() is the one door back to the term.
// Imports the vocabulary and the labels and nothing heavier (config-shape.spec.ts).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { FOR_TERMS, type ForTerm } from "./facets";
import { FOR_LABELS } from "./labels";

/** The PDF's two section titles, verbatim (uppercase: short section labels, D-05). */
export const YOUR_LIBRARY = "YOUR LIBRARY";
const MADE_FOR = "MADE FOR";

/** Which of the library's three views the gallery is showing. */
export type LibraryView = "all" | "favorites" | "recent";

/** The PDF's three library rows, verbatim, in the PDF's order. */
export const LIBRARY_ROWS: readonly { id: LibraryView; label: string }[] =
  Object.freeze([
    { id: "all", label: "All configs" },
    { id: "favorites", label: "Favorites" },
    { id: "recent", label: "Recently used" },
  ]);

/** A rail row as src/lib/ui/shell/Rail.svelte takes it, plus the term it stands for. */
export type RailRowOf = {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
  /** The FOR term behind a MADE FOR row; absent on a library row. */
  readonly term?: ForTerm;
};

export type RailSectionOf = {
  readonly title: string;
  readonly rows: readonly RailRowOf[];
};

/** A MADE FOR row: the term is not optional there. */
export type MadeForRow = RailRowOf & { readonly term: ForTerm };

const FOR_ROW_PREFIX = "for:";

/** The rail row id for a FOR term. */
export function forRowId(term: ForTerm): string {
  return `${FOR_ROW_PREFIX}${term}`;
}

/** The FOR term a rail row id names, or undefined for a library row or an unknown id. */
export function forTermOf(rowId: string): ForTerm | undefined {
  if (!rowId.startsWith(FOR_ROW_PREFIX)) return undefined;
  const term = rowId.slice(FOR_ROW_PREFIX.length);
  return FOR_TERMS.find((candidate) => candidate === term);
}

/**
 * The MADE FOR rows: one per FOR_TERMS member, in the vocabulary's own order,
 * labelled through FOR_LABELS, carrying NO count (the PDF shows none).
 */
export function madeForRows(): readonly MadeForRow[] {
  return FOR_TERMS.map((term) => ({
    id: forRowId(term),
    label: FOR_LABELS[term],
    term,
  }));
}

/** The counts the library rows show, padded to two digits by the rail itself. */
export type LibraryCounts = {
  readonly all: number;
  readonly favorites: number;
  readonly recent: number;
};

/** The whole rail: YOUR LIBRARY with counts, then MADE FOR derived. */
export function railSections(counts: LibraryCounts): readonly RailSectionOf[] {
  return [
    {
      title: YOUR_LIBRARY,
      rows: LIBRARY_ROWS.map((row) => ({
        id: row.id,
        label: row.label,
        count: counts[row.id],
      })),
    },
    { title: MADE_FOR, rows: madeForRows() },
  ];
}
