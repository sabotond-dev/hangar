// The stamp: the envelope `/playground/<id>#z.<format><payload>`, HANGAR's own
// format letters for the Lua route (`x` knob indices, `w` indices plus RGB444
// colours; `y` and `z` reserved - all four outside the base-32 payload alphabet,
// so BOTOR's writer can never emit one), the entry-consistency check and the
// three landings `restored | older | unreadable` (`none` for no hash). The stamp
// lives in the hash, never the query string (D-12). `older` is reachable only
// through the Lua formats' shape character; a BOTOR stamp that fails the check
// is `unreadable`, and format `x` is never removed, only stopped being emitted
// (fixtures/wild-stamps.json holds 54 that must land forever). Model side of
// D-18: no component names this module; url.ts is the component-safe half.
// Decided at 10-08 (D-06, format w); see .planning/phases/10-redesign/10-08-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  STAMP_ALPHABET,
  STAMP_FORMAT_PRESET,
  STAMP_PREFIX,
  decodeStamp,
  encodeStamp,
  quantiseColour,
  type PadState,
  type RGB,
} from "../../vendor/botor/_pad";
import type { CatalogEntry } from "../catalog/types";
import { STAMP_OPTION_CEILING, luaKnobs } from "../tune/knobs.lua";
import {
  presetKnobs,
  type KnobDescriptor,
  type PresetKnob,
} from "../tune/knobs.preset";
import { applyKnob, baseStateFor } from "../tune/state";

/** The four format letters HANGAR claims: outside the base-32 payload alphabet, so never BOTOR payload. */
export const HANGAR_FORMAT_LETTERS: readonly string[] = ["w", "x", "y", "z"];

/** The Lua knob-index format. One base-32 character per knob. */
export const HANGAR_FORMAT_LUA = "x";

/**
 * The Lua knob-index-plus-colour format (D-06, plan 10-08). One base-32
 * character per non-colour knob, THREE per colour knob. The letter was
 * reserved in HANGAR_FORMAT_LETTERS from the start.
 */
export const HANGAR_FORMAT_LUA_COLOUR = "w";

/** Every format letter HANGAR emits or decodes. Neither route may see these. */
const HANGAR_FORMATS: readonly string[] = [
  HANGAR_FORMAT_LUA,
  HANGAR_FORMAT_LUA_COLOUR,
];

/** A colour knob, on either route. Found by KIND, never by id. */
const isColour = (knob: KnobDescriptor): boolean => knob.kind === "colour";

/**
 * How many characters format `w` gives one colour knob, and why it is three
 * rather than one.
 *
 * A colour is twelve bits - RGB444, sixteen steps per channel, and
 * `quantiseColour` is what makes that exact rather than approximate. Base 32 is
 * five bits per character, so twelve bits is three characters at four bits
 * each, one per channel, with the top bit of each character unused. Packing
 * twelve bits into three five-bit characters would save nothing (the payload
 * would still be three characters) and would cost the property that makes this
 * format readable by hand: character 1 IS red's step, 2 IS green's, 3 IS
 * blue's.
 */
export const COLOUR_FIELD_CHARS = 3;

const rgbOfLiteral = (literal: string): RGB | undefined => {
  const parts = literal.split(",");
  if (parts.length !== 3) return undefined;
  const [r, g, b] = parts.map((n) => Number.parseInt(n, 10));
  if (![r, g, b].every((v) => Number.isInteger(v) && v >= 0 && v <= 255)) {
    return undefined;
  }
  return { r, g, b };
};

const literalOfRgb = (c: RGB): string => `${c.r},${c.g},${c.b}`;

/** A colour as three base-32 characters, one 4-bit channel each. */
function writeColourField(colour: RGB): string {
  const q = quantiseColour(colour);
  return (
    STAMP_ALPHABET[q.r / 17] +
    STAMP_ALPHABET[q.g / 17] +
    STAMP_ALPHABET[q.b / 17]
  );
}

/** The inverse. `undefined` for a character outside the sixteen steps. */
function readColourField(chars: string): RGB | undefined {
  if (chars.length !== COLOUR_FIELD_CHARS) return undefined;
  const steps = [...chars].map((each) => STAMP_ALPHABET.indexOf(each));
  if (steps.some((step) => step < 0 || step > 15)) return undefined;
  return { r: steps[0] * 17, g: steps[1] * 17, b: steps[2] * 17 };
}

/**
 * How many characters a knob's field takes, on both Lua formats: three for a colour (above), TWO for
 * a WIDE knob - one with more options than one base-32 character can index (change 8, 2026-09-18:
 * ORBIT's four ring notes, 128 each) - and one for everything else. A wide field is the position in
 * base 32, high character first, so a rack with no wide knob is encoded exactly as it was before.
 */
export function fieldChars(knob: KnobDescriptor): number {
  if (isColour(knob)) return COLOUR_FIELD_CHARS;
  return knob.options.length > STAMP_OPTION_CEILING ? WIDE_FIELD_CHARS : 1;
}

/** A wide knob's field: two base-32 characters, 1,024 positions. */
export const WIDE_FIELD_CHARS = 2;

/** A position as its field: one character, or two for a wide knob (high first). */
function writeIndexField(knob: KnobDescriptor, at: number): string {
  if (fieldChars(knob) === WIDE_FIELD_CHARS) {
    return (
      STAMP_ALPHABET[Math.floor(at / STAMP_ALPHABET.length)] +
      STAMP_ALPHABET[at % STAMP_ALPHABET.length]
    );
  }
  return STAMP_ALPHABET[at];
}

/** The inverse: the position a field names, or -1 for a character outside the alphabet. */
function readIndexField(knob: KnobDescriptor, chars: string): number {
  if (fieldChars(knob) === WIDE_FIELD_CHARS) {
    const high = STAMP_ALPHABET.indexOf(chars[0]);
    const low = STAMP_ALPHABET.indexOf(chars[1]);
    return high < 0 || low < 0 ? -1 : high * STAMP_ALPHABET.length + low;
  }
  return STAMP_ALPHABET.indexOf(chars[0]);
}

/** Format `w`'s payload length for a rack. Two, plus one, two or three per knob (`fieldChars`). */
export function luaColourPayloadLength(
  knobs: readonly KnobDescriptor[],
): number {
  return 2 + knobs.reduce((n, knob) => n + fieldChars(knob), 0);
}

/** Format `x`'s payload length for a rack: two, plus one or two per knob (no colour field on `x`). */
export function luaPayloadLength(knobs: readonly KnobDescriptor[]): number {
  return (
    2 +
    knobs.reduce((n, knob) => n + (isColour(knob) ? 1 : fieldChars(knob)), 0)
  );
}

/**
 * Whether an entry's rack is emitted as `w` rather than as `x`.
 *
 * Two conditions, both necessary. It must carry at least one colour knob - an
 * entry with none has nothing `w` can say that `x` cannot, so it keeps
 * emitting `x` and its links never change shape at all. And every colour
 * knob's options must be real RGB literals, because `w` stores a colour and
 * not an index: a colour knob whose values are not colours has nothing to
 * store. Today that is 25 of the 27 hand-authored entries; `cull` and
 * `quadrant` declare no colour knob and stay on `x`.
 */
export function emitsLuaColourFormat(
  knobs: readonly KnobDescriptor[],
): boolean {
  const colours = knobs.filter(isColour);
  return (
    colours.length > 0 &&
    colours.every((knob) =>
      knob.options.every((option) => rgbOfLiteral(option) !== undefined),
    )
  );
}

/** What format `w` carries, before any of it is turned into knob positions. */
export type LuaColourPayload = {
  /** Every NON-colour knob's index. */
  indices: Record<string, number>;
  /** Every colour knob's stored colour, as twelve bits made whole again. */
  colours: Record<string, RGB>;
};

/**
 * Format `w`'s payload, parsed and nothing more - no shape check, no mapping
 * of a colour onto a knob position.
 *
 * Exported because it is the only way to prove the claim the format exists
 * for: that all 4,096 lattice colours ride it and come back unchanged.
 * `stamp-roundtrip.sweep.spec.ts`'s Pass B enumerates exactly that, per colour
 * knob, and a proof that stopped at the knob's own option list would be
 * proving the palette rather than the format.
 */
export function readLuaColourPayload(
  knobs: readonly KnobDescriptor[],
  payload: string,
): LuaColourPayload | undefined {
  if (payload[0] !== HANGAR_FORMAT_LUA_COLOUR) return undefined;
  if (payload.length !== luaColourPayloadLength(knobs)) return undefined;
  const indices: Record<string, number> = {};
  const colours: Record<string, RGB> = {};
  let at = 2;
  for (const knob of knobs) {
    if (isColour(knob)) {
      const colour = readColourField(
        payload.slice(at, at + COLOUR_FIELD_CHARS),
      );
      if (!colour) return undefined;
      colours[knob.id] = colour;
      at += COLOUR_FIELD_CHARS;
      continue;
    }
    const width = fieldChars(knob);
    const position = readIndexField(knob, payload.slice(at, at + width));
    if (position < 0 || position >= knob.options.length) return undefined;
    indices[knob.id] = position;
    at += width;
  }
  return { indices, colours };
}

/** A rack's colour knob written as format `w`'s three characters. */
export function writeLuaColourPayload(
  knobs: readonly KnobDescriptor[],
  positions: (knob: KnobDescriptor) => number,
): string {
  let body = "";
  for (const knob of knobs) {
    const at = positions(knob);
    if (isColour(knob)) {
      const colour = rgbOfLiteral(knob.options[at]) ?? { r: 0, g: 0, b: 0 };
      body += writeColourField(colour);
      continue;
    }
    body += writeIndexField(knob, at);
  }
  return `${HANGAR_FORMAT_LUA_COLOUR}${shapeOf(knobs)}${body}`;
}

/** Where a stamped URL lands, and therefore which sentence the panel says. */
export type Landing =
  | { kind: "none" }
  | { kind: "restored"; indices: Record<string, number> }
  | { kind: "older" }
  | { kind: "unreadable" };

const NONE: Landing = { kind: "none" };
const OLDER: Landing = { kind: "older" };
const UNREADABLE: Landing = { kind: "unreadable" };

/**
 * The compiler-driven knobs of an entry, in rack order, or an empty list.
 *
 * A `state`-kind source is compiler driven and has no descriptor table of its
 * own, so it exposes no knobs and can carry no stamp - a true answer rather
 * than an invented rack.
 */
export function compilerKnobs(entry: CatalogEntry): readonly PresetKnob[] {
  if (entry.preview !== "padsim" || entry.source.kind !== "preset") return [];
  // Change 17C: a wrapped preset's superseded knobs (the Send, the Channel, JOYSTICK's Bend) leave
  // the compiler's rack - the compiler compiles their shelf values and the wrap rewrites the sends.
  const gone = new Set(entry.supersedes ?? []);
  return presetKnobs(entry.source.presetId).filter(
    (knob) => !gone.has(knob.id),
  );
}

/**
 * Every knob the panel shows for an entry, in rack order, whichever route it
 * came from.
 *
 * `model.ts` resolves its rack through this same function, which is what makes
 * "the stamp is encoded against exactly the knobs the visitor turned" true by
 * construction rather than by two tables agreeing.
 *
 * A WRAPPED PRESET (change 17C) shows both kinds: its compiler knobs, and its MIDI outputs' token
 * knobs. An output knob that takes a superseded shelf knob's id takes its rack position too (the
 * Send's place is the X axis's Number, the Channel's the Channel), so a saved copy's positional
 * indices keep landing on the knob they were; the rest are appended in the entry's order.
 */
export function stampKnobs(entry: CatalogEntry): readonly KnobDescriptor[] {
  if (entry.preview === "lua") return luaKnobs(entry);
  const own = luaKnobs(entry);
  if (own.length === 0 || entry.source.kind !== "preset") {
    return compilerKnobs(entry);
  }
  const gone = new Set(entry.supersedes ?? []);
  const byId = new Map(own.map((knob) => [knob.id, knob]));
  const placed = new Set<string>();
  const rack: KnobDescriptor[] = [];
  for (const knob of presetKnobs(entry.source.presetId)) {
    const taker = byId.get(knob.id);
    if (taker !== undefined && gone.has(knob.id)) {
      rack.push(taker);
      placed.add(knob.id);
    } else if (!gone.has(knob.id)) {
      rack.push(knob);
    }
  }
  for (const knob of own) if (!placed.has(knob.id)) rack.push(knob);
  return rack;
}

/** A wrapped preset's output knobs (change 17C): the part of its rack the vendored stamp cannot carry. */
const outputKnobsOf = (entry: CatalogEntry): readonly KnobDescriptor[] =>
  entry.preview === "padsim" ? luaKnobs(entry) : [];

/**
 * The shape character: a tripwire, not a hash.
 *
 * It turns an added, removed or resized knob into a graceful failure instead of
 * a silently wrong restore. An added or removed knob also moves the payload
 * LENGTH, which the length check catches first; a RESIZED knob is what this
 * character exists for, and it is what makes `older` reachable at all.
 */
function shapeOf(knobs: readonly KnobDescriptor[]): string {
  const values = knobs.reduce((n, knob) => n + knob.options.length, 0);
  return STAMP_ALPHABET[(knobs.length * 7 + values) % STAMP_ALPHABET.length];
}

/** An asked-for index, or the knob's default when it is not a position. */
function positionOf(asked: number | undefined, knob: KnobDescriptor): number {
  if (typeof asked !== "number") return knob.default;
  return Number.isInteger(asked) && asked >= 0 && asked < knob.options.length
    ? asked
    : knob.default;
}

function atDefaults(
  knobs: readonly KnobDescriptor[],
  indices: Record<string, number>,
): boolean {
  return knobs.every(
    (knob) => positionOf(indices[knob.id], knob) === knob.default,
  );
}

function defaultIndices(
  knobs: readonly KnobDescriptor[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const knob of knobs) out[knob.id] = knob.default;
  return out;
}

/** Step 3 of the check, and the encoder's own state builder. One function. */
function stateFor(
  entry: CatalogEntry,
  knobs: readonly PresetKnob[],
  indices: Record<string, number>,
): PadState {
  let state = baseStateFor(entry);
  for (const knob of knobs) {
    state = applyKnob(state, knob, positionOf(indices[knob.id], knob));
  }
  return state;
}

/**
 * `"#z.at7ghh1pv8j00"` -> `"at7ghh1pv8j00"`. Anything else -> `undefined`.
 *
 * A real fragment is required: a bare `#`, an empty prefix, a query string and
 * a prefix-less string are all refused, because D-12 puts the stamp in the hash
 * and nowhere else.
 */
export function parseHash(hash: string): string | undefined {
  if (typeof hash !== "string") return undefined;
  if (!hash.startsWith("#")) return undefined;
  const body = hash.slice(1);
  if (!body.startsWith(STAMP_PREFIX)) return undefined;
  const payload = body.slice(STAMP_PREFIX.length);
  return payload.length > 0 ? payload : undefined;
}

/**
 * The payload for an index vector, or `undefined` at the defaults.
 *
 * Emitting nothing at the defaults is not an optimisation: a URL with no
 * fragment IS the base configuration, which is both prettier and exactly what
 * SHARE-01 restores.
 */
export function encodeFor(
  entry: CatalogEntry,
  indices: Record<string, number>,
): string | undefined {
  const knobs = stampKnobs(entry);
  if (knobs.length === 0) return undefined;
  if (atDefaults(knobs, indices)) return undefined;
  // Change 17C: a wrapped preset whose outputs are off their defaults writes HANGAR's index format
  // over its whole rack (the vendored stamp holds a PadState and no output); at the outputs'
  // defaults it keeps writing the vendored stamp, so every link it wrote before still lands.
  const outputs = outputKnobsOf(entry);
  const midiMoved = !atDefaults(outputs, indices);
  if (entry.preview === "lua" || midiMoved) {
    // Format `w` ONLY for a rack that carries a colour; everything else keeps
    // emitting `x`, unchanged, forever.
    if (emitsLuaColourFormat(knobs)) {
      return writeLuaColourPayload(knobs, (knob) =>
        positionOf(indices[knob.id], knob),
      );
    }
    const positions = knobs
      .map((knob) => {
        const at = positionOf(indices[knob.id], knob);
        // A colour knob is one palette index on `x`; a wide knob two characters.
        return isColour(knob) ? STAMP_ALPHABET[at] : writeIndexField(knob, at);
      })
      .join("");
    return `${HANGAR_FORMAT_LUA}${shapeOf(knobs)}${positions}`;
  }
  return encodeStamp(stateFor(entry, compilerKnobs(entry), indices));
}

/**
 * Format `w`, under a Lua entry. Length and range first, shape last, exactly
 * as format `x` does it. The one step `x` does not have: a stored COLOUR has
 * to become a knob POSITION, and the comparison is made on the QUANTISED
 * literal on both sides - a Lua palette is authored freely (`0,200,255`) and
 * `w` stores RGB444 (`0,204,255`), so a raw comparison would match nothing;
 * stamp-roundtrip.sweep.spec.ts's Pass A proves the round trip over the whole
 * cross-product. A colour the knob's own list cannot name FAILS CLOSED - an
 * unreadable stamp rather than a silently wrong one.
 */
function decodeLuaColour(
  knobs: readonly KnobDescriptor[],
  payload: string,
): Landing {
  const read = readLuaColourPayload(knobs, payload);
  if (!read) return UNREADABLE;
  const indices: Record<string, number> = { ...read.indices };
  for (const knob of knobs) {
    if (!isColour(knob)) continue;
    const wanted = literalOfRgb(read.colours[knob.id]);
    const at = knob.options.findIndex((option) => {
      const rgb = rgbOfLiteral(option);
      return rgb ? literalOfRgb(quantiseColour(rgb)) === wanted : false;
    });
    if (at < 0) return UNREADABLE;
    indices[knob.id] = at;
  }
  // Last, and only once the payload is known to be well formed.
  if (payload[1] !== shapeOf(knobs)) return OLDER;
  return { kind: "restored", indices };
}

/** Format `x`, under a Lua entry. Length and range first, shape last. */
function decodeLua(knobs: readonly KnobDescriptor[], payload: string): Landing {
  if (payload[0] === HANGAR_FORMAT_LUA_COLOUR) {
    return decodeLuaColour(knobs, payload);
  }
  if (payload[0] !== HANGAR_FORMAT_LUA) return UNREADABLE;
  if (payload.length !== luaPayloadLength(knobs)) return UNREADABLE;
  const indices: Record<string, number> = {};
  let at = 2;
  for (const knob of knobs) {
    // A colour knob is one palette index on `x` (the format predates `w`); a wide knob is two.
    const width = isColour(knob) ? 1 : fieldChars(knob);
    const position = readIndexField(knob, payload.slice(at, at + width));
    if (position < 0 || position >= knob.options.length) return UNREADABLE;
    indices[knob.id] = position;
    at += width;
  }
  // Last, and only once the payload is known to be well formed: an unreadable
  // stamp must not be reported as merely old.
  if (payload[1] !== shapeOf(knobs)) return OLDER;
  return { kind: "restored", indices };
}

/** A BOTOR format, under a compiler-driven entry. */
function decodeCompiler(entry: CatalogEntry, payload: string): Landing {
  const source = entry.source;
  // The `p` row, decided BEFORE the consistency check: `p<presetId>` is the
  // untuned card's own stamp (a BOTOR base-card link), and the rebuild below
  // can never equal it because applying a knob deletes state.preset. It lands
  // restored at every default; any other preset id stays unreadable.
  if (
    payload[0] === STAMP_FORMAT_PRESET &&
    source.kind === "preset" &&
    payload.slice(1) === source.presetId
  ) {
    return { kind: "restored", indices: defaultIndices(stampKnobs(entry)) };
  }
  const decoded = decodeStamp(payload);
  if (typeof decoded === "undefined") return UNREADABLE;
  const knobs = compilerKnobs(entry);
  if (knobs.length === 0) return UNREADABLE;

  // A wrapped preset's outputs are not in a PadState: a vendored stamp lands them at their
  // defaults, which is where every vendored stamp of such a card was written (change 17C).
  const indices: Record<string, number> = defaultIndices(outputKnobsOf(entry));
  let rebuilt = baseStateFor(entry);
  for (const knob of knobs) {
    const position = knob.read(decoded);
    indices[knob.id] = position;
    rebuilt = applyKnob(rebuilt, knob, position);
  }
  // THE WHOLE GUARD. A stamp this entry's knobs cannot produce is not this
  // entry's stamp. Deleting this line makes `/playground/aurora/#z.pdial` render Dial.
  if (encodeStamp(rebuilt) !== payload) return UNREADABLE;
  return { kind: "restored", indices };
}

/** Where a payload lands under this entry. Total: it never throws. */
export function decodeFor(
  entry: CatalogEntry,
  payload: string | undefined,
): Landing {
  if (typeof payload !== "string" || payload.length === 0) return NONE;
  if (entry.preview === "lua") return decodeLua(stampKnobs(entry), payload);
  // A HANGAR format under a compiler entry is the wrong route, and saying so
  // here rather than letting decodeStamp decline it keeps the two routes
  // symmetric. `w` joins `x` in this check for the same reason `x` is in it.
  // Change 17C: a wrapped preset reads HANGAR's index formats over its whole rack, as a Lua entry
  // reads them over its own; every other compiler entry still refuses them.
  if (HANGAR_FORMATS.includes(payload[0])) {
    return outputKnobsOf(entry).length > 0
      ? decodeLua(stampKnobs(entry), payload)
      : UNREADABLE;
  }
  return decodeCompiler(entry, payload);
}
