// The other knob route: a hand-authored Lua entry's token-substitution knobs,
// renamed into the shape a compiler-driven card's knobs already arrive in.
//
// THE PANEL CANNOT TELL THE TWO ROUTES APART, and that is the whole point of
// this file. Both arrive as an ordered list of discrete options and an index
// into it, and view.ts chooses the widget from the kind and the option count
// alone. Nothing downstream branches on where a knob came from: a preset knob
// additionally knows how to move a `PadState` (`PresetKnob`), and a Lua knob
// does not, but neither the rack nor the readouts ever ask.
//
// So this is a RENAME, not a transformation. `LuaKnob.values` becomes
// `options`, `token` is dropped - it belongs to renderLua and to nothing else -
// and the default index is resolved from the entry's own `defaults` table when
// it declares one.
//
// SCOPE REALITY, stated plainly: no Lua entry is in the front-door row
// (`EXCLUDED_FROM_ROW`, Phase 8 D-18), so this route has NO visitor-facing
// surface in Phase 5. It exists because D-02 and D-13 require both routes to be
// one shape, it is fully exercised in Vitest and on /dev/catalog/, and no plan
// in this phase may add a Lua entry to `FRONT_DOOR` to make a demo work. That
// is a curation decision recorded for the user, not one taken here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { CatalogEntry } from "../catalog/types";
import type { KnobDescriptor } from "./knobs.preset";

/**
 * The most options any knob on any route may carry.
 *
 * D-13 encodes a knob position as ONE base-32 character, so a 33rd option
 * would not overflow loudly - it would truncate silently and land a shared
 * link on the wrong position. Today's widest knob is 16 (a MIDI channel, on
 * both routes), so this is headroom rather than a limit anyone is near.
 */
export const STAMP_OPTION_CEILING = 32;

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
  }));
}
