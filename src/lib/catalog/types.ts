// The catalog's shape (D-09, D-10): what a HANGAR configuration is, whether it
// was ported from the vendored shelf or hand-authored here. Deliberately almost
// empty at runtime - a knob-kind list, three asserted constants and one pure
// function - so a page that only lists names imports it without anything heavy.
// Not imported here, by rule: the pinned protocol package (its module type and
// two event numbers are restated as literals and asserted in catalog.spec.ts,
// the protocol-pin.ts pattern); the compile surface (build() takes compiled
// Lua as an argument - the surface sits behind the FOUND-05 WASM gate); the
// simulator (frames are the fixture's business).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { KnobKind, PadState } from "../../vendor/botor/_pad";

/**
 * How a configuration is produced, and therefore how it previews.
 *
 * `preset` names one of the nine entries on the vendored shelf; `state` is an
 * arbitrary compiler state; `lua` is hand-authored source for the two events.
 */
export type CatalogSource =
  | { kind: "preset"; presetId: string }
  | { kind: "state"; state: PadState }
  | { kind: "lua"; setup: string; timer: string };

/**
 * A knob on a hand-authored Lua entry (D-12): literal token substitution.
 *
 * `kind` comes from the vendored compiler's own `KnobKind` union - the same
 * widget vocabulary the compiler-driven cards use - so a Lua entry and a preset
 * entry ask the panel for the same controls. Inventing a Lua-specific union is
 * exactly what D-12 forbids.
 *
 * `values` are strings even when they read as numbers ("110", "0,200,255",
 * "3,5,7"). One type keeps the knob-sweep budget arithmetic trivial and keeps
 * the stamp envelope D-13 defers to Phase 5 an integer-index problem rather
 * than a value-encoding one.
 */
export type LuaKnob = {
  /** Stable slug, unique within the entry. */
  id: string;
  /** Human label, e.g. "Tempo". */
  label: string;
  /** The shared widget vocabulary, from the vendored compiler. */
  kind: KnobKind;
  /** Substitution token, matching ^@[A-Z][A-Z0-9_]*$ - e.g. "@TEMPO". */
  token: string;
  /** Literal Lua text, in display order. At least two. */
  values: readonly string[];
  /** An INDEX into `values`, never a value (D-13: integer knob indices). */
  default: number;
  /**
   * The INDEX the browser preview renders this knob at when it cannot honour the chosen one (change
   * 8, 2026-09-18: ORBIT's Sync - the browser has no MIDI clock, so the preview runs Internal). The
   * wire, the meters and the stamp carry the chosen index; only `createLuaPadSim` reads this, and
   * the inspector says so whenever the two differ. Absent: the preview renders the chosen index.
   */
  previewIndex?: number;
};

/** One configuration in the catalog, ported or hand-authored. */
export type CatalogEntry = {
  /** URL slug, stable forever. Matches ^[a-z][a-z0-9-]*$. */
  id: string;
  /** Display name, sentence case (D-14 Q11b), e.g. "Euclid", "Radar points". */
  name: string;
  /** One line, no newline. */
  description: string;
  /** Feel-based (CONT-03): how the card feels to use, never a compiler kind. */
  tags: readonly string[];
  featured: boolean;
  /** "YYYY-MM-DD". Drives the Newest sort. */
  addedAt: string;
  source: CatalogSource;
  /** DERIVED from source.kind by previewFor, stored explicitly. */
  preview: "padsim" | "lua";
  knobs: readonly LuaKnob[];
  /** Knob id -> INDEX into that knob's `values`. */
  defaults: Readonly<Record<string, number>>;
  /**
   * FALSE: the inspector offers this card neither Randomize (with its Undo) nor a lock on a knob
   * row (change 7, 2026-09-18: CHORUS). Absent means true - every other card is as it was.
   */
  rollable?: boolean;

  // TRUE iff this entry renders an all-zero frame at EVERY sampled tick with no
  // touch input. Not a preference - a fact about the configuration, asserted
  // against frames.json in both directions by frames.spec.ts test 5. Several
  // genuinely useful cards are dark at rest: tpad writes no LEDs at all, and a
  // card whose only light is a touch response has nothing to show until a finger
  // arrives. Declaring it is what stops "the picture went black" being
  // indistinguishable from "this one is meant to be black".
  restsBlack: boolean;
};

/**
 * The one derivation of `preview` from `source`. Exported so an entry file
 * cannot get it wrong, and asserted for every entry in catalog.spec.ts.
 */
export function previewFor(source: CatalogSource): "padsim" | "lua" {
  return source.kind === "lua" ? "lua" : "padsim";
}

/**
 * The runtime knob-kind list. TypeScript unions do not exist at runtime and the
 * gate has to check a `kind` string against something.
 */
export const KNOB_KINDS = [
  "colour",
  "speed",
  "direction",
  "size",
  "count",
  "note",
  "feel",
  "amount",
  "mode",
  "bend",
  "spring",
  "scale",
] as const;

// If the vendored KnobKind union ever gains a member, this line stops compiling
// and `npm run check` names it. That is the whole point: the vocabulary is
// BOTOR's, and HANGAR must not silently fall behind it.
type MissingKnobKind = Exclude<KnobKind, (typeof KNOB_KINDS)[number]>;
const _knobKindsAreExhaustive: MissingKnobKind extends never ? true : never =
  true;
void _knobKindsAreExhaustive;

// The three values below are literals HERE and are asserted against the pinned
// package inside catalog.spec.ts. See the module comment: importing them as
// values would put the whole package's module graph in the catalog's chunk.

/** The pinned package's ZONA module type - a string, not a number. */
export const ZONA_MODULE_TYPE = "ZONA";
/** The pinned package's SETUP event number. */
export const EVENT_SETUP = 0;
/** The pinned package's TIMER event number. */
export const EVENT_TIMER = 6;

/** The Profile-Cloud-shaped object a ZONA configuration is exported as. */
export type PadConfigObject = {
  id: string;
  name: string;
  description: string;
  configType: "preset";
  type: typeof ZONA_MODULE_TYPE;
  version: { major: number; minor: number; patch: number };
  configs: [
    {
      controlElementNumber: 0;
      events: [
        { event: typeof EVENT_SETUP; config: string },
        { event: typeof EVENT_TIMER; config: string },
      ];
    },
  ];
};

/**
 * Wrap already-compiled Lua in the Profile-Cloud shape (CAT-04).
 *
 * `lua` is an argument and never produced here: the thing that turns a
 * configuration into two event strings lives behind the FOUND-05 WASM gate, and
 * this module must stay importable by a caller that only wants to list names.
 * Setup comes first and Timer second, in the `configs[0].events` order the
 * exported object declares; the install sequencer's RAM-first ordering is a
 * separate concern and does not live in a data shape.
 */
export function build(
  entry: CatalogEntry,
  lua: { setup: string; timer: string },
  version: { major: number; minor: number; patch: number },
): PadConfigObject {
  return {
    id: entry.id,
    name: entry.name,
    description: entry.description,
    configType: "preset",
    type: ZONA_MODULE_TYPE,
    version: {
      major: version.major,
      minor: version.minor,
      patch: version.patch,
    },
    configs: [
      {
        controlElementNumber: 0,
        events: [
          { event: EVENT_SETUP, config: lua.setup },
          { event: EVENT_TIMER, config: lua.timer },
        ],
      },
    ],
  };
}
