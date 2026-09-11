// ONE display transform, applied at render time and nowhere else.
//
// It replaces an ASCII apostrophe standing BETWEEN TWO LETTERS with U+2019 and
// changes nothing else: no quotes, no ellipses, no dashes, and no apostrophe at
// a word edge - pads' stays pads', 'tis stays 'tis, rock 'n' roll stays as
// authored. Those are already correct, and a broader transform would stop being
// typography and start editing copy.
//
// WHY IT EXISTS AND WHY IT IS NOT A DATA FIX.
// Three catalog descriptions carry a straight apostrophe and this phase is what
// puts them on screen. Two are HANGAR's own - GHOST's and MORPH's - and plan
// 05.1-05 corrects those AT SOURCE. The third is Radar's, and its source is
// src/vendor/botor/_pad.ts: vendored copy that may never be edited (Phase 3
// D-04, held by src/lib/fidelity/vendored-diff.spec.ts, mirrored byte-equal in
// front-door.ts and listing.ts and held there by catalog.spec.ts,
// front-door.spec.ts and listing.spec.ts). So the card shows finger's with a
// typographic apostrophe while every one of those equality gates goes on
// matching the vendored bytes.
//
// NOT applied to the meta and og:description tags in
// src/routes/playground/[id]/+page.svelte. Those stay byte-equal to their source and
// e2e/first-experience.e2e.ts reads them.
//
// NOTHING COMPILED CHANGES. Descriptions are metadata, never Lua, so the 908
// character budgets, the compressScript fixed points, frames.json and every
// gate that hashes a rendered pad are all untouched by this file.
//
// This module imports nothing.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * U+2019 RIGHT SINGLE QUOTATION MARK, by code point rather than as a pasted
 * glyph, so the one character this file is about cannot be lost to an encoding
 * accident in some future copy of the source.
 */
const RIGHT_SINGLE_QUOTE = "’";

/**
 * An ASCII apostrophe with a letter on each side.
 *
 * The preceding letter is CAPTURED and the following one is a LOOKAHEAD, not a
 * second capture, and that is deliberate: a match consumes only "letter + '", so
 * scanning resumes on the following letter and a word with two of them - a'b'c -
 * curls both. Capturing both sides would swallow the shared letter and miss the
 * second.
 *
 * Lookahead rather than lookbehind on purpose too: lookbehind arrived in Safari
 * 16.4, and a SyntaxError at module-parse time on an older browser would take
 * the whole page down for the visitors who can only ever browse. The Unicode
 * property escape needs only ES2018, which every target has.
 */
const BETWEEN_LETTERS = /(\p{L})'(?=\p{L})/gu;

/** The description a card or a detail page shows. Never the data it shows it from. */
export function typographic(text: string): string {
  return text.replace(BETWEEN_LETTERS, "$1" + RIGHT_SINGLE_QUOTE);
}
