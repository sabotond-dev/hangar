// The stamp codec, over EVERY knob position either route can produce.
//
// Two tests, no sampling. SHARE-01 says a shared link restores the knobs
// exactly, and "exactly" is a claim about a cross-product, not about a handful
// of hand-picked vectors: `stamp.spec.ts` proves the mechanism on examples, and
// this file proves the property on the whole space.
//
// NO FORMATTER IS NEEDED. `encodeStamp` and `decodeStamp` never cross the WASM
// boundary - they are bit writers over a `PadState` - and format `x` is pure
// string arithmetic. So this file runs in the sweep project for membership
// rather than for cost: it belongs beside the reachability sweep because they
// share the same cross-product, and running it per task would say nothing that
// `stamp.spec.ts` does not already say per task.
//
// IT IS A PROPERTY OF THE PINNED COMPILER, like everything else here. A
// vendored re-sync that widened a `PadState` field HANGAR does not expose would
// break the entry-consistency check for exactly the reason the check exists,
// and this file is where that would be seen first.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CATALOG, type CatalogEntry } from "../catalog";
import { STAMP_OPTION_CEILING } from "../tune/knobs.lua";
import type { KnobDescriptor } from "../tune/knobs.preset";
import { HANGAR_FORMAT_LUA, decodeFor, encodeFor, stampKnobs } from "./stamp";

type Indices = Record<string, number>;

const say = (line: string): void => {
  // Directly to the stream: Vitest's console interception swallows output
  // emitted outside a test body, and a report nobody sees is not a report.
  process.stdout.write(`${line}\n`);
};

/** The full cross-product, as a generator: 32,852 vectors must not be an array. */
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

/**
 * One route's whole cross-product, encoded and decoded back.
 *
 * Returns the number of vectors examined so the caller can assert
 * non-vacuity BEFORE it asserts the property - a sweep whose enumeration
 * silently shrank would otherwise green while checking nothing.
 */
function roundTrip(
  entries: readonly CatalogEntry[],
  onPayload: (
    entry: CatalogEntry,
    knobs: readonly KnobDescriptor[],
    payload: string,
  ) => void,
): number {
  let examined = 0;
  for (const entry of entries) {
    const knobs = stampKnobs(entry);
    for (const indices of vectors(knobs)) {
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
  it("round-trips every compiler-driven entry's whole knob cross-product", () => {
    const entries = tunable("padsim");
    expect(entries.length, "there are compiler-driven entries").toBe(9);

    const expected = entries.reduce(
      (n, entry) => n + sizeOf(stampKnobs(entry)),
      0,
    );
    const started = performance.now();
    let longest = 0;
    const examined = roundTrip(entries, (_entry, _knobs, payload) => {
      longest = Math.max(longest, payload.length);
    });
    const seconds = ((performance.now() - started) / 1000).toFixed(1);

    say("");
    say("stamp round-trip sweep - the compiler route");
    for (const entry of entries) {
      say(
        `  ${entry.id.padEnd(10)} ${String(sizeOf(stampKnobs(entry))).padStart(6)}`,
      );
    }
    say(
      `  total ${examined} vectors, longest payload ${longest} characters, ${seconds}s`,
    );

    expect(examined, "the enumeration silently shrank").toBe(expected);
    expect(
      examined,
      "the compiler cross-product is not trivial",
    ).toBeGreaterThan(16000);
    // BOTOR's own stamps stay short: a loaded instrument is about twenty
    // characters, and a URL fragment nobody can read is not shareable.
    expect(longest, `the longest compiler payload is ${longest}`).toBeLessThan(
      32,
    );
  }, 300000);

  it("round-trips every Lua entry's whole cross-product through format x", () => {
    const entries = tunable("lua");
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );

    // The one-character-per-knob encoding cannot survive a 33rd option: it
    // would not overflow loudly, it would truncate silently and land a shared
    // link on the wrong position.
    for (const entry of entries) {
      for (const knob of stampKnobs(entry)) {
        expect(
          knob.options.length,
          `${entry.id}/${knob.id} has ${knob.options.length} options, past the one-character ceiling`,
        ).toBeLessThanOrEqual(STAMP_OPTION_CEILING);
      }
    }

    const expected = entries.reduce(
      (n, entry) => n + sizeOf(stampKnobs(entry)),
      0,
    );
    const started = performance.now();
    const examined = roundTrip(entries, (entry, knobs, payload) => {
      if (payload[0] !== HANGAR_FORMAT_LUA) {
        throw new Error(`${entry.id}: ${payload} is not format x`);
      }
      if (payload.length !== 2 + knobs.length) {
        throw new Error(
          `${entry.id}: ${payload} is ${payload.length} characters, not ${2 + knobs.length}`,
        );
      }
    });
    const seconds = ((performance.now() - started) / 1000).toFixed(1);

    say("");
    say("stamp round-trip sweep - the Lua route");
    for (const entry of entries) {
      const knobs = stampKnobs(entry);
      say(
        `  ${entry.id.padEnd(10)} ${String(sizeOf(knobs)).padStart(6)}` +
          `  payload ${2 + knobs.length} characters`,
      );
    }
    say(`  total ${examined} vectors, ${seconds}s`);

    expect(examined, "the enumeration silently shrank").toBe(expected);
    expect(examined, "the Lua cross-product is not trivial").toBeGreaterThan(
      100000,
    );
  }, 300000);
});
