// The FOR facet's DISPLAY labels, one per machine term - APPROVED as shipped
// by 13-18-BATCH.md rows E.1-E.8 and 13-CONTEXT D-23 (2026-09-12; recorded by
// 13-19): the seven values below are the user's, and the chip-versus-rail
// question was answered "no" - one label per term.
//
// FOR_TERMS in ./facets.ts holds identifiers: `modulation`, `show`,
// `sequencing`, `mixing`, `play`, `shortcuts`, `pointing`. Until plan 13-08
// the gallery rendered them by upper-casing the identifier, which 13-CONTEXT
// D-05 retires: uppercase is for short section labels and breadcrumbs, and
// SHORTCUTS as a rail row is a paragraph-voice identifier wearing a label's
// clothes. The PDF's rail reads Modulation, Notes & chords, Visuals,
// Expression - four rows, three of which name no FOR term at all - so the
// display strings were HANGAR's to write and the user's to approve. The seven
// below were 13-08's proposals, in the vocabulary's own order, ledgered for
// 13-18's batch together with the chip-versus-rail naming question (the PDF
// shows `Notes & chords` on the rail and `Notes` in the chip row - a shorter
// chip label for one facet); the batch kept all seven (E.1-E.7: `Visuals` for
// the PDF's three spellings of one facet, `Playing` because the term is a
// verb) and declined the short form (E.8). Any later change is this one table
// and not seven call sites: the rail (src/lib/browse/rail.ts), the chip row
// (BrowseToolbar.svelte through FacetRow.svelte) and the card's category line
// (CatalogCard.svelte) all read it, so a chip and its rail row can never carry
// two unrelated strings.
//
// THE RECORD IS KEYED EXHAUSTIVELY BY ForTerm. Retiring a term in facets.ts
// without removing its row here, or adding one without a label, is a type
// error rather than an identifier leaking onto the screen. A FEELS term has
// no row and no label: the card's second word is the identifier itself
// (`readable`, `still`), upper-cased by the card's CSS as the PDF draws the
// line, and that is stated in CatalogCard.svelte rather than hidden.
//
// This module imports a TYPE and nothing else, so naming it from the gallery
// page costs that page no specifier that reaches the compile surface
// (src/lib/config-shape.spec.ts test 13 walks it).
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
