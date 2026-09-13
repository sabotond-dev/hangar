// The FOR facet's display labels, one per machine term in ./facets.ts, approved
// as shipped by 13-18-BATCH.md rows E.1-E.8 and 13-CONTEXT D-23 (recorded by
// 13-19): one label per term, no shorter chip form (E.8). Until 13-08 the
// gallery upper-cased the identifier, which D-05 retires; the PDF's rail names
// no FOR term, so the seven were HANGAR's to write and the user's to approve.
// The rail (browse/rail.ts), the chip row (BrowseToolbar.svelte through
// FacetRow.svelte) and the card's category line (CatalogCard.svelte) read this
// one table. Keyed exhaustively by ForTerm: a term retired or added in facets.ts
// without its row here is a type error; a FEELS term has no row (the card shows
// the identifier). Imports a TYPE and nothing else (config-shape.spec.ts test 13).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { ForTerm } from "./facets";

/**
 * The seven, keyed by machine term. The values are the batch's, approved
 * (D-23); the keys are the vocabulary's and move only when facets.ts moves.
 */
export const FOR_LABELS: Readonly<Record<ForTerm, string>> = Object.freeze({
  modulation: "Modulation",
  show: "Visuals",
  sequencing: "Sequencing",
  mixing: "Mixing",
  play: "Playing",
  shortcuts: "Shortcuts",
  pointing: "Pointing",
});

/**
 * The display label for a term, or the term itself when it is not a FOR
 * term. Total, so a card can hand it any tag: a FEELS term comes back
 * unchanged and the caller decides how to case it.
 */
export function forLabel(term: string): string {
  return (
    (FOR_LABELS as Readonly<Record<string, string | undefined>>)[term] ?? term
  );
}
