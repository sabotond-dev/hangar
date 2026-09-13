// ONE display transform, applied at render time and nowhere else: an ASCII
// apostrophe BETWEEN TWO LETTERS becomes U+2019, and nothing else changes - no
// quotes, ellipses or dashes, no apostrophe at a word edge (pads' stays pads').
// It exists because Radar's description carries a straight apostrophe in
// src/vendor/botor/_pad.ts, vendored copy that may never be edited and is
// mirrored byte-equal into front-door.ts and listing.ts under three equality
// gates; the card shows finger's typographically while every gate goes on
// matching the vendored bytes. Not applied to the meta / og:description tags
// (e2e/first-experience.e2e.ts reads them byte-equal). Descriptions are
// metadata, never Lua, so nothing compiled changes. Imports nothing.
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
