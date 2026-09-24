// The other knob route: a hand-authored Lua entry's token-substitution knobs,
// renamed into the shape a compiler-driven card's knobs already arrive in. THE
// PANEL CANNOT TELL THE TWO ROUTES APART: both arrive as an ordered list of
// discrete options and an index, and view.ts chooses the widget from the kind
// and the option count alone; nothing downstream branches on where a knob came
// from. A RENAME, not a transformation: `LuaKnob.values` becomes `options`,
// `token` is dropped (it belongs to renderLua), and the default index is
// resolved from the entry's own `defaults` table when it declares one.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { CatalogEntry } from "../catalog/types";
import type { KnobDescriptor } from "./knobs.preset";

/**
 * The most options a knob may carry in ONE base-32 stamp character.
 *
 * D-13 encodes a knob position as one base-32 character, so a 33rd option
 * would not overflow loudly - it would truncate silently and land a shared
 * link on the wrong position. Since change 8 (2026-09-18) a knob past this
 * ceiling is WIDE and rides two characters (`stamp.ts`'s `fieldChars`), up to
 * `STAMP_WIDE_CEILING`; ORBIT's four ring notes (128 options each) are the
 * first. Every other knob on either route is at most 16 (a MIDI channel).
 */
export const STAMP_OPTION_CEILING = 32;

/** The most options a two-character (wide) knob may carry: 32 * 32. */
export const STAMP_WIDE_CEILING = STAMP_OPTION_CEILING * STAMP_OPTION_CEILING;

/**
 * A Lua entry's knobs as shared descriptors, in catalog order.
 *
 * An entry that declares no knobs - every ported preset entry, whose knobs
 * live in knobs.preset.ts instead - yields an empty list rather than a throw:
 * "this entry has no token knobs" is a true answer, not an error.
 */
export function luaKnobs(entry: CatalogEntry): readonly KnobDescriptor[] {
  return entry.knobs.map((knob) => ({
    id: knob.id,
    label: knob.label,
    kind: knob.kind,
    options: knob.values,
    // The entry's table wins where it declares one. Both numbers are indices
    // into the same list and the catalog's own spec keeps them in agreement;
    // reading the table first is what makes `defaults` the single place an
    // entry states where it ships.
    default: entry.defaults[knob.id] ?? knob.default,
    // A lattice colour knob's own colours ride along (change 19): the picker's quick-pick row.
    ...(knob.palette === undefined ? {} : { palette: knob.palette }),
  }));
}
