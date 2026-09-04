// The stamp: the envelope `/c/<id>#z.<format><payload>`, HANGAR's own format
// letter for the Lua route, the entry-consistency check and the three landings.
//
// THE ENVELOPE. `STAMP_PREFIX` is `z.` and `STAMP_ALPHABET` is base THIRTY-TWO,
// not 36 - D-12's "base36" is loose wording and the vendored `BitWriter` packs
// five bits per character. The stamp lives in the HASH and never in the query
// string (D-12), which is why `parseHash` refuses anything that is not a real
// fragment.
//
// HANGAR CLAIMS `w`, `x`, `y` AND `z` as format letters, and those four are
// collision-proof: they sit outside the base-32 payload alphabet
// (`0123456789abcdefghijklmnopqrstuv`), so BOTOR's own writer can never emit
// one as payload, and BOTOR - whose letters so far are `a`, `b`, `c`, `d` and
// `p`, with `e` next - would need eighteen more format bumps to reach them.
// `x` is the Lua knob-index format; the other three are reserved.
//
// `older` IS REACHABLE ONLY THROUGH FORMAT `x`'s SHAPE CHARACTER. `decodeStamp`
// fails closed on an unknown format, an out-of-domain field, a set reserved
// bit, a truncated payload and a non-zero tail, and it returns `undefined` for
// every one of them - so for a compiler-driven entry there is no way to tell an
// OLD encoding from a CORRUPT one, and every such stamp lands `unreadable`.
// That is a real limitation of the vendored codec, it is not a defect here, and
// it is written down so nobody later "fixes" the classifier by guessing.
//
// THE CLASSIFICATION, exactly. This is the one place SHARE-03's two strings are
// chosen between, so the rule is transcribed rather than inferred:
//
//   | Condition                                                        | Landing      |
//   |------------------------------------------------------------------|--------------|
//   | no hash, or a hash without the `z.` prefix                        | none         |
//   | format x, right length, every index in range, shape DISAGREES     | older        |
//   | format x, right length, every index in range, shape agrees        | restored     |
//   | format x with a wrong length, an out-of-alphabet character, or an |              |
//   |   index past the end of its options                               | unreadable   |
//   | format p whose preset id equals this entry's source.presetId      | restored, at |
//   |                                                                   | every default|
//   | a BOTOR format that decodeStamp refuses                           | unreadable   |
//   | a BOTOR format that decodes but fails the consistency check       | unreadable   |
//   | format x on a compiler entry, or a BOTOR format on a Lua entry    | unreadable   |
//   | a format letter in neither set                                    | unreadable   |
//
// THE `p` ROW IS NOT AN EXCEPTION BOLTED ON; it is the one link the consistency
// check would otherwise refuse. `p<presetId>` is what `encodeStamp` emits for
// an untuned card, so it is exactly the stamp a BOTOR base-card link carries -
// a legitimate, common inbound URL. Run it through the four steps below and it
// fails: step 3 rebuilds by APPLYING knobs, every apply goes through
// `withChange`, and `withChange` deletes `state.preset`, so `encodeStamp` of
// the rebuild is a field dump and can never equal `paurora`. Classifying that
// unreadable would put SHARE-03's apology on a link that is perfectly correct.
// So format `p` is decided BEFORE the check, by one string comparison, and it
// lands `restored` at every default index - the same state a URL with no
// fragment would have shown. `p<any other preset>` is untouched by this and
// stays `unreadable`.
//
// THE ENTRY-CONSISTENCY CHECK (05-RESEARCH), and it is the whole of SHARE-03's
// "never a subtly wrong one":
//
//   1. decode -> PadState, else unreadable.
//   2. read each of the entry's knob descriptors OUT of the decoded state.
//   3. rebuild: start from the entry's base state, apply every knob at its
//      read index.
//   4. require encodeStamp(rebuilt) === the payload. Otherwise unreadable.
//
// Step 4 is a one-line assertion that the stamp is reachable from THIS entry's
// knobs and nothing else. It also covers a future vendored re-sync widening a
// field HANGAR does not expose.
//
// This module imports the vendored codec and the knob tables, so it is on the
// model side of D-18: no Svelte component may name it, and it is reached only
// through the same dynamic import as `model.ts`. The component-safe half of the
// sharing story is `src/lib/share/url.ts`, which imports nothing at all.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  STAMP_ALPHABET,
  STAMP_FORMAT_PRESET,
  STAMP_PREFIX,
  decodeStamp,
  encodeStamp,
  type PadState,
} from "../../vendor/botor/_pad";
import type { CatalogEntry } from "../catalog/types";
import { luaKnobs } from "../tune/knobs.lua";
import {
  presetKnobs,
  type KnobDescriptor,
  type PresetKnob,
} from "../tune/knobs.preset";
import { applyKnob, baseStateFor } from "../tune/state";

/** The four format letters HANGAR claims. See the header for why these four. */
export const HANGAR_FORMAT_LETTERS: readonly string[] = ["w", "x", "y", "z"];

/** The Lua knob-index format. One base-32 character per knob. */
export const HANGAR_FORMAT_LUA = "x";

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
  return entry.preview === "padsim" && entry.source.kind === "preset"
    ? presetKnobs(entry.source.presetId)
    : [];
}

/**
 * Every knob the panel shows for an entry, in rack order, whichever route it
 * came from.
 *
 * `model.ts` resolves its rack through this same function, which is what makes
 * "the stamp is encoded against exactly the knobs the visitor turned" true by
 * construction rather than by two tables agreeing.
 */
export function stampKnobs(entry: CatalogEntry): readonly KnobDescriptor[] {
  return entry.preview === "lua" ? luaKnobs(entry) : compilerKnobs(entry);
}

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
  if (entry.preview === "lua") {
    const positions = knobs
      .map((knob) => STAMP_ALPHABET[positionOf(indices[knob.id], knob)])
      .join("");
    return `${HANGAR_FORMAT_LUA}${shapeOf(knobs)}${positions}`;
  }
  return encodeStamp(stateFor(entry, compilerKnobs(entry), indices));
}

/** Format `x`, under a Lua entry. Length and range first, shape last. */
function decodeLua(knobs: readonly KnobDescriptor[], payload: string): Landing {
  if (payload[0] !== HANGAR_FORMAT_LUA) return UNREADABLE;
  if (payload.length !== 2 + knobs.length) return UNREADABLE;
  const indices: Record<string, number> = {};
  for (let at = 0; at < knobs.length; at += 1) {
    const position = STAMP_ALPHABET.indexOf(payload[2 + at]);
    if (position < 0 || position >= knobs[at].options.length) return UNREADABLE;
    indices[knobs[at].id] = position;
  }
  // Last, and only once the payload is known to be well formed: an unreadable
  // stamp must not be reported as merely old.
  if (payload[1] !== shapeOf(knobs)) return OLDER;
  return { kind: "restored", indices };
}

/** A BOTOR format, under a compiler-driven entry. */
function decodeCompiler(entry: CatalogEntry, payload: string): Landing {
  const source = entry.source;
  // The `p` row, decided BEFORE the consistency check. See the header.
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

  const indices: Record<string, number> = {};
  let rebuilt = baseStateFor(entry);
  for (const knob of knobs) {
    const position = knob.read(decoded);
    indices[knob.id] = position;
    rebuilt = applyKnob(rebuilt, knob, position);
  }
  // THE WHOLE GUARD. A stamp this entry's knobs cannot produce is not this
  // entry's stamp. Deleting this line makes `/c/aurora/#z.pdial` render Dial.
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
  // Format x under a compiler entry is the wrong route, and saying so here
  // rather than letting decodeStamp decline it keeps the two routes symmetric.
  if (payload[0] === HANGAR_FORMAT_LUA) return UNREADABLE;
  return decodeCompiler(entry, payload);
}
