// The stamp codec, over EVERY knob position either route can produce.
//
// Two tests, no sampling. SHARE-01 says a shared link restores the knobs
// exactly, and "exactly" is a claim about a cross-product, not about a handful
// of hand-picked vectors: `stamp.spec.ts` proves the mechanism on examples, and
// this file proves the property on the whole space.
//
// NO FORMATTER IS NEEDED. `encodeStamp` and `decodeStamp` never cross the WASM
// boundary - they are bit writers over a `PadState` - and formats `x` and `w`
// are pure string arithmetic. So this file runs in the sweep project for
// membership rather than for cost: it belongs beside the reachability sweep
// because they share the same cross-product, and running it per task would say
// nothing that `stamp.spec.ts` does not already say per task.
//
// IT IS A PROPERTY OF THE PINNED COMPILER, like everything else here. A
// vendored re-sync that widened a `PadState` field HANGAR does not expose would
// break the entry-consistency check for exactly the reason the check exists,
// and this file is where that would be seen first.
//
// AMENDMENT, plan 10-08: THE SAME TWO PASSES AS THE REACHABILITY SWEEP, AND THE
// TWO HALVES MOVE IN OPPOSITE DIRECTIONS.
//
// D-06 gives a colour knob the whole RGB444 lattice, so a single cross-product
// would multiply each colour-bearing rack by 683. Both halves therefore split:
//
//   PASS A - every NON-colour knob cross-producted, colour knobs at their
//            defaults.
//   PASS B - the colour dimension alone, every other knob at its default.
//
//   compiler half   32,852 -> 44,078   = Pass A 19,502 + Pass B 24,576   (+34%)
//   Lua half       276,160 -> 234,784  = Pass A 50,464 + Pass B 184,320  (-15%)
//
// THE LUA HALF GETS CHEAPER, and that is the check that the passes were not
// accidentally cross-producted: a Lua rack's colour knobs carry four or five
// options today, so lifting them out of the cross-product divides more than
// the linear pass adds back. If this half ever grows, the two passes were
// multiplied rather than summed.
//
// THE TWO HALVES' PASS B ARE DIFFERENT SHAPES, DELIBERATELY, and the asymmetry
// is the seam between this plan and 10-10 rather than an inconsistency:
//
//   - On the COMPILER route the lattice IS the knob. `knobs.preset.ts` gives
//     the colour knob 4,096 positions, so Pass B enumerates the knob's own
//     options and round-trips each through `encodeFor`/`decodeFor` exactly as
//     Pass A does. 4,096 x 6 colour knobs = 24,576.
//   - On the LUA route the lattice is the FORMAT'S CAPACITY, not yet the
//     knob's. A Lua colour knob still offers the literals its entry declares;
//     what 10-08 lands is format `w`, which stores a COLOUR rather than an
//     index and therefore has to carry all 4,096 before the picker at 10-10
//     can write them. So Pass B enumerates the payload space per colour knob:
//     4,096 x 45 colour knobs = 184,320, asserted through
//     `readLuaColourPayload` rather than through a knob index, because a knob
//     index is exactly the thing the format stopped being.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { STAMP_ALPHABET } from "../../vendor/botor/_pad";
import { CATALOG, type CatalogEntry } from "../catalog";
import { STAMP_OPTION_CEILING } from "../tune/knobs.lua";
import { COLOUR_LATTICE_SIZE } from "../tune/knobs.preset";
import type { KnobDescriptor } from "../tune/knobs.preset";
import {
  COLOUR_FIELD_CHARS,
  HANGAR_FORMAT_LUA,
  HANGAR_FORMAT_LUA_COLOUR,
  decodeFor,
  emitsLuaColourFormat,
  encodeFor,
  luaColourPayloadLength,
  readLuaColourPayload,
  stampKnobs,
  writeLuaColourPayload,
} from "./stamp";

type Indices = Record<string, number>;

const say = (line: string): void => {
  // Directly to the stream: Vitest's console interception swallows output
  // emitted outside a test body, and a report nobody sees is not a report.
  process.stdout.write(`${line}\n`);
};

/** A colour knob, on either route. Found by KIND, never by id. */
const isColour = (knob: KnobDescriptor): boolean => knob.kind === "colour";

const nonColour = (
  knobs: readonly KnobDescriptor[],
): readonly KnobDescriptor[] => knobs.filter((knob) => !isColour(knob));

const colourKnobs = (
  knobs: readonly KnobDescriptor[],
): readonly KnobDescriptor[] => knobs.filter(isColour);

/** The full cross-product, as a generator: a pass is not a thing to materialise. */
function* vectors(knobs: readonly KnobDescriptor[]): Generator<Indices> {
  const counts = knobs.map((knob) => knob.options.length);
  const total = counts.reduce((product, n) => product * n, 1);
  for (let n = 0; n < total; n += 1) {
    const out: Indices = {};
    let rest = n;
    for (let at = 0; at < knobs.length; at += 1) {
      out[knobs[at].id] = rest % counts[at];
      rest = Math.floor(rest / counts[at]);
    }
    yield out;
  }
}

const sizeOf = (knobs: readonly KnobDescriptor[]): number =>
  knobs.reduce((product, knob) => product * knob.options.length, 1);

const defaultsOf = (knobs: readonly KnobDescriptor[]): Indices => {
  const out: Indices = {};
  for (const knob of knobs) out[knob.id] = knob.default;
  return out;
};

const atDefaults = (knobs: readonly KnobDescriptor[], at: Indices): boolean =>
  knobs.every((knob) => at[knob.id] === knob.default);

const sameIndices = (a: Indices, b: Indices): boolean =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.keys(a).every((key) => a[key] === b[key]);

/** Every entry of one route that actually exposes knobs. */
function tunable(preview: CatalogEntry["preview"]): CatalogEntry[] {
  return CATALOG.filter(
    (entry) => entry.preview === preview && stampKnobs(entry).length > 0,
  );
}

/** Pass A: every non-colour knob, colour knobs held at their defaults. */
function* passA(knobs: readonly KnobDescriptor[]): Generator<Indices> {
  const pinned = defaultsOf(colourKnobs(knobs));
  for (const vector of vectors(nonColour(knobs))) {
    yield { ...vector, ...pinned };
  }
}

/** Pass B: the colour dimension, every other knob at its default index. */
function* passB(knobs: readonly KnobDescriptor[]): Generator<Indices> {
  const defaults = defaultsOf(knobs);
  for (const knob of colourKnobs(knobs)) {
    for (let at = 0; at < knob.options.length; at += 1) {
      yield { ...defaults, [knob.id]: at };
    }
  }
}

/**
 * One pass, encoded and decoded back.
 *
 * Returns the number of vectors examined so the caller can assert non-vacuity
 * BEFORE it asserts the property - a sweep whose enumeration silently shrank
 * would otherwise green while checking nothing.
 */
function roundTrip(
  entries: readonly CatalogEntry[],
  pass: (knobs: readonly KnobDescriptor[]) => Generator<Indices>,
  onPayload: (
    entry: CatalogEntry,
    knobs: readonly KnobDescriptor[],
    payload: string,
  ) => void,
): number {
  let examined = 0;
  for (const entry of entries) {
    const knobs = stampKnobs(entry);
    for (const indices of pass(knobs)) {
      const payload = encodeFor(entry, indices);
      if (atDefaults(knobs, indices)) {
        expect(
          payload,
          `${entry.id}: the defaults must carry no stamp`,
        ).toBeUndefined();
        examined += 1;
        continue;
      }
      if (typeof payload !== "string") {
        throw new Error(
          `${entry.id}: a tuned vector produced no stamp: ${JSON.stringify(indices)}`,
        );
      }
      onPayload(entry, knobs, payload);
      const landing = decodeFor(entry, payload);
      if (
        landing.kind !== "restored" ||
        !sameIndices(landing.indices, indices)
      ) {
        throw new Error(
          `${entry.id}: ${payload} landed ${landing.kind} for ` +
            `${JSON.stringify(indices)}` +
            (landing.kind === "restored"
              ? ` as ${JSON.stringify(landing.indices)}`
              : ""),
        );
      }
      examined += 1;
    }
  }
  return examined;
}

describe("stamp round-trip sweep: every knob position either route can reach", () => {
  it("round-trips every compiler-driven entry, in two passes", () => {
    const entries = tunable("padsim");
    expect(entries.length, "there are compiler-driven entries").toBe(9);

    const expectedA = entries.reduce(
      (n, entry) => n + sizeOf(nonColour(stampKnobs(entry))),
      0,
    );
    const expectedB = entries.reduce(
      (n, entry) =>
        n +
        colourKnobs(stampKnobs(entry)).reduce(
          (m, knob) => m + knob.options.length,
          0,
        ),
      0,
    );
    const started = performance.now();
    let longest = 0;
    const note = (
      _entry: CatalogEntry,
      _knobs: readonly KnobDescriptor[],
      payload: string,
    ): void => {
      longest = Math.max(longest, payload.length);
    };
    const examinedA = roundTrip(entries, passA, note);
    const examinedB = roundTrip(entries, passB, note);
    const examined = examinedA + examinedB;
    const seconds = ((performance.now() - started) / 1000).toFixed(1);

    say("");
    say("stamp round-trip sweep - the compiler route, two passes");
    for (const entry of entries) {
      const knobs = stampKnobs(entry);
      say(
        `  ${entry.id.padEnd(10)} passA ${String(sizeOf(nonColour(knobs))).padStart(6)}` +
          `  passB ${String(
            colourKnobs(knobs).reduce((m, k) => m + k.options.length, 0),
          ).padStart(6)}`,
      );
    }
    say(
      `  Pass A ${examinedA}, Pass B ${examinedB}, total ${examined} vectors, ` +
        `longest payload ${longest} characters, ${seconds}s`,
    );

    expect(examinedA, "Pass A's enumeration silently shrank").toBe(expectedA);
    expect(examinedB, "Pass B's enumeration silently shrank").toBe(expectedB);
    // THE FLOOR, RE-DERIVED as the two passes' own sum. The old 16,000 was
    // half of one 32,852-state cross-product and means nothing now that there
    // is no single cross-product. 40,000 is above EITHER PASS ALONE - Pass A
    // is 19,502, Pass B is 24,576 - so it can only be cleared when both passes
    // really ran, which is exactly the failure a floor exists to catch. It is
    // a literal because `expectedA` and `expectedB` are derived from the same
    // racks the passes read.
    expect(
      examined,
      "the compiler cross-product is not trivial",
    ).toBeGreaterThan(40000);
    // BOTOR's own stamps stay short: a loaded instrument is about twenty
    // characters, and a URL fragment nobody can read is not shareable.
    expect(longest, `the longest compiler payload is ${longest}`).toBeLessThan(
      32,
    );
  }, 300000);

  it("round-trips every Lua entry through formats x and w, in two passes", () => {
    const entries = tunable("lua");
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );

    // The one-character-per-knob encoding cannot survive a 33rd option: it
    // would not overflow loudly, it would truncate silently and land a shared
    // link on the wrong position.
    //
    // THE COLOUR EXEMPTION IS BY FORMAT, NOT BY A RAISED CEILING (10-08). A
    // lattice colour knob carries 4,096 positions and does not ride the
    // base-32 index payload at all - it rides format `w`'s twelve raw bits, or
    // BOTOR's own RGB444 colour field on the compiler route. Raising
    // `STAMP_OPTION_CEILING` to admit it would silently remove this guard from
    // EVERY OTHER KNOB, which is the one thing it exists to prevent. So the
    // ceiling stays 32 and the exemption is named here, at the assertion.
    expect(STAMP_OPTION_CEILING, "the ceiling is not raised").toBe(32);
    let guarded = 0;
    let exempted = 0;
    for (const entry of entries) {
      for (const knob of stampKnobs(entry)) {
        if (isColour(knob)) {
          exempted += 1;
          continue;
        }
        expect(
          knob.options.length,
          `${entry.id}/${knob.id} has ${knob.options.length} options, past the one-character ceiling`,
        ).toBeLessThanOrEqual(STAMP_OPTION_CEILING);
        guarded += 1;
      }
    }
    // RE-CHOSEN BY PLAN 11-01, which removed nine hand-authored entries on the
    // user's bench report. The catalog's hand-authored knob total went 133 to
    // 91 and its colour knobs 45 to 29, so `guarded` went 88 to 62 - which is
    // the same arithmetic seen from the other side, and it reconciles: 62 + 29
    // is 91.
    //
    // 50 is a NON-VACUITY FLOOR and not a count: it fails on a `stampKnobs`
    // that quietly stopped returning most of them, which is the failure this
    // line exists for, and it does not have to be edited by every wave that
    // adds or removes a knob. `exempted` stays an EQUALITY, because the colour
    // exemption is the thing being audited and a floor would let a knob slip
    // out of the guarded set unnoticed.
    //
    // THIS FILE IS NOT IN 11-01-PLAN.md'S BLAST-RADIUS TABLE, which recorded
    // the sweep as untouched at "4 19". The member list and the test count are
    // indeed unchanged; two literals inside one of the tests were not.
    // Reported in 11-01-SUMMARY.md rather than quietly absorbed.
    //
    // RE-COUNTED BY PLAN 11-15, and it is not in that plan's file list either -
    // found the same way, by running the sweep. WHEELS declares SIX knobs,
    // THREE of them colour, so the hand-authored knob total goes 91 to 97,
    // `exempted` 29 to 32 and `guarded` 62 to 65. It still reconciles: 65 + 32
    // is 97. The member list is still "4 19".
    expect(guarded, "knobs still behind the ceiling").toBeGreaterThan(50);
    expect(exempted, "the colour knobs, exempt by format").toBe(32);

    // PASS A. Every non-colour knob cross-producted, colour knobs at their
    // defaults, through the real encoder and the real decoder.
    const expectedA = entries.reduce(
      (n, entry) => n + sizeOf(nonColour(stampKnobs(entry))),
      0,
    );
    const started = performance.now();
    let formatW = 0;
    let formatX = 0;
    const examinedA = roundTrip(entries, passA, (entry, knobs, payload) => {
      const colours = colourKnobs(knobs).length;
      const expectedFormat =
        colours > 0 ? HANGAR_FORMAT_LUA_COLOUR : HANGAR_FORMAT_LUA;
      if (payload[0] !== expectedFormat) {
        throw new Error(
          `${entry.id}: ${payload} is format ${payload[0]}, not ${expectedFormat}`,
        );
      }
      if (payload[0] === HANGAR_FORMAT_LUA_COLOUR) formatW += 1;
      else formatX += 1;
      const wanted =
        colours > 0 ? luaColourPayloadLength(knobs) : 2 + knobs.length;
      if (payload.length !== wanted) {
        throw new Error(
          `${entry.id}: ${payload} is ${payload.length} characters, not ${wanted}`,
        );
      }
    });

    // PASS B, and it is the FORMAT's capacity rather than the knob's. See the
    // header: 10-08 lands format `w`, 10-10 lands the picker that writes into
    // it, and this is what proves the format is ready for it. The three
    // characters are built here from `STAMP_ALPHABET` directly rather than by
    // calling the encoder, so the test states the wire format independently
    // and the module has to agree with it.
    let examinedB = 0;
    for (const entry of entries) {
      const knobs = stampKnobs(entry);
      if (!emitsLuaColourFormat(knobs)) continue;
      const base = writeLuaColourPayload(knobs, (knob) => knob.default);
      expect(base.length, `${entry.id}: format w payload length`).toBe(
        luaColourPayloadLength(knobs),
      );
      let at = 2;
      for (const knob of knobs) {
        if (!isColour(knob)) {
          at += 1;
          continue;
        }
        for (let step = 0; step < COLOUR_LATTICE_SIZE; step += 1) {
          const r = (step >> 8) & 15;
          const g = (step >> 4) & 15;
          const b = step & 15;
          const field =
            STAMP_ALPHABET[r] + STAMP_ALPHABET[g] + STAMP_ALPHABET[b];
          const payload =
            base.slice(0, at) + field + base.slice(at + COLOUR_FIELD_CHARS);
          const read = readLuaColourPayload(knobs, payload);
          if (!read) {
            throw new Error(
              `${entry.id}/${knob.id}: ${payload} did not parse at step ${step}`,
            );
          }
          const got = read.colours[knob.id];
          if (got.r !== r * 17 || got.g !== g * 17 || got.b !== b * 17) {
            throw new Error(
              `${entry.id}/${knob.id} step ${step}: ${payload} carried ` +
                `${got.r},${got.g},${got.b} instead of ${r * 17},${g * 17},${b * 17}`,
            );
          }
          examinedB += 1;
        }
        at += COLOUR_FIELD_CHARS;
      }
    }
    const expectedB = entries.reduce(
      (n, entry) =>
        n +
        (emitsLuaColourFormat(stampKnobs(entry))
          ? colourKnobs(stampKnobs(entry)).length * COLOUR_LATTICE_SIZE
          : 0),
      0,
    );

    const examined = examinedA + examinedB;
    const seconds = ((performance.now() - started) / 1000).toFixed(1);

    say("");
    say("stamp round-trip sweep - the Lua route, two passes");
    for (const entry of entries) {
      const knobs = stampKnobs(entry);
      const colours = colourKnobs(knobs).length;
      say(
        `  ${entry.id.padEnd(10)} passA ${String(sizeOf(nonColour(knobs))).padStart(6)}` +
          `  passB ${String(colours * COLOUR_LATTICE_SIZE).padStart(6)}` +
          `  format ${colours > 0 ? "w" : "x"}` +
          `  payload ${colours > 0 ? luaColourPayloadLength(knobs) : 2 + knobs.length} characters`,
      );
    }
    say(
      `  Pass A ${examinedA} vectors (format w ${formatW}, format x ${formatX}), ` +
        `Pass B ${examinedB} colours, total ${examined}, ${seconds}s`,
    );

    expect(examinedA, "Pass A's enumeration silently shrank").toBe(expectedA);
    expect(examinedB, "Pass B's enumeration silently shrank").toBe(expectedB);
    // THE FLOOR, RE-DERIVED as the two passes' own sum, the same way the
    // compiler half's is. The old 100,000 was a fraction of one 276,160-vector
    // cross-product. 200,000 was above EITHER PASS ALONE at thirty-six entries
    // - Pass A was 50,464 and Pass B 184,320 - so it could only be cleared when
    // both really ran.
    //
    // RE-CHOSEN BY PLAN 11-01, and the construction is kept rather than the
    // number. At twenty-seven entries the observed passes are Pass A 49,792 and
    // Pass B 118,784, summing to 168,576, so 200,000 stopped being a floor and
    // became a permanent red. 120,000 is above either pass alone by the same
    // rule the old number was chosen by: neither 49,792 nor 118,784 clears it,
    // and only the sum does.
    expect(examined, "the Lua cross-product is not trivial").toBeGreaterThan(
      120000,
    );
    // AND THE DIRECTION. The Lua half must SHRINK against the 276,160 vectors
    // the single cross-product cost, because lifting four- and five-option
    // colour knobs out of a product divides more than a linear pass adds back.
    // If this ever fails, the two passes were cross-producted rather than
    // summed, and the sweep is measuring a space nobody can reach.
    expect(
      examined,
      "the two Lua passes cost more than the single cross-product they replace",
    ).toBeLessThan(276160);
  }, 300000);
});
