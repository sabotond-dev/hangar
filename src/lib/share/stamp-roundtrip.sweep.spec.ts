// The stamp codec over EVERY knob position either route can produce: SHARE-01's "exactly" is a
// claim about a cross-product, so `stamp.spec.ts` proves the mechanism on examples and this file the
// property on the whole space. No formatter is needed (the codec never crosses the WASM boundary); it
// runs in the sweep project for membership beside the reachability sweep. A property of the pinned
// compiler. Two passes since 10-08, as the reachability sweep: Pass A every non-colour knob
// cross-producted with colour knobs at their defaults, Pass B the colour dimension alone. The
// compiler half 32,852 -> 44,078 (Pass A 19,502 + Pass B 24,576: the lattice IS the knob, 4,096 x 6);
// the Lua half 276,160 -> 234,784 (Pass A 50,464 + Pass B 184,320: the lattice is format `w`'s
// CAPACITY, 4,096 x 45 colour knobs, asserted through `readLuaColourPayload`). The Lua half getting
// cheaper is the check that the passes were summed, not multiplied.
// Decided at 05-05 / 10-08; see .planning/phases/10-redesign/10-08-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { STAMP_ALPHABET } from "../../vendor/botor/_pad";
import { CATALOG, type CatalogEntry } from "../catalog";
import { STAMP_OPTION_CEILING, STAMP_WIDE_CEILING } from "../tune/knobs.lua";
import { COLOUR_LATTICE_SIZE } from "../tune/knobs.preset";
import type { KnobDescriptor } from "../tune/knobs.preset";
import {
  COLOUR_FIELD_CHARS,
  HANGAR_FORMAT_LUA,
  HANGAR_FORMAT_LUA_COLOUR,
  decodeFor,
  emitsLuaColourFormat,
  encodeFor,
  fieldChars,
  luaColourPayloadLength,
  luaPayloadLength,
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

/** A WIDE knob (change 8, 2026-09-18): past one base-32 character, it rides two (stamp.ts's `fieldChars`). */
const isWide = (knob: KnobDescriptor): boolean =>
  !isColour(knob) && knob.options.length > STAMP_OPTION_CEILING;

/** The knobs Pass A cross-products: every non-colour knob that is not wide. */
const narrow = (knobs: readonly KnobDescriptor[]): readonly KnobDescriptor[] =>
  knobs.filter((knob) => !isColour(knob) && !isWide(knob));

const wideKnobs = (
  knobs: readonly KnobDescriptor[],
): readonly KnobDescriptor[] => knobs.filter(isWide);

/**
 * Pass A: every narrow non-colour knob cross-producted, colour knobs AND wide
 * knobs held at their defaults. A wide knob is held because four of them at
 * 128 positions each (ORBIT's ring notes) would multiply the product by
 * 2.7 x 10^8; Pass C walks every one of their positions instead, and a field's
 * encoding is per knob (the separability the stamp's fixed layout gives), so
 * nothing a wide knob does is hidden by the split.
 */
function* passA(knobs: readonly KnobDescriptor[]): Generator<Indices> {
  const pinned = {
    ...defaultsOf(colourKnobs(knobs)),
    ...defaultsOf(wideKnobs(knobs)),
  };
  for (const vector of vectors(narrow(knobs))) {
    yield { ...vector, ...pinned };
  }
}

/** Pass C: every position of every wide knob, every other knob at its default; then the all-wide-last corner. */
function* passC(knobs: readonly KnobDescriptor[]): Generator<Indices> {
  const defaults = defaultsOf(knobs);
  const wide = wideKnobs(knobs);
  for (const knob of wide) {
    for (let at = 0; at < knob.options.length; at += 1) {
      yield { ...defaults, [knob.id]: at };
    }
  }
  if (wide.length > 1) {
    const corner: Indices = { ...defaults };
    for (const knob of wide) corner[knob.id] = knob.options.length - 1;
    yield corner;
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
    // EIGHT since plan 12-10: the `tpad` preset is on the shelf but not in
    // the catalog - the hand-authored TRACKPAD replaced it as the card. Its
    // stamps were format p (the vendored encoder over the PadState) and never
    // an index vector, so no captured link's decode moves; what leaves this
    // pass is its 512-state cross-product, found the same way as every
    // re-count in this file - by running the sweep.
    //
    // SEVEN since change 12b (2026-09-18): RADAR is a Lua card under the
    // preset's id, so its BOTOR-format stamps leave this pass (they land
    // unreadable under the Lua route, stamp.spec.ts) and its `w` stamps join
    // the Lua pass below - found the same way, by running the sweep.
    expect(entries.length, "there are compiler-driven entries").toBe(7);

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
    // THE FLOOR, RE-DERIVED as the two passes' own sum, and lowered on
    // 2026-09-17 (BENCH-2026-09-16.txt section 5b): the retired brightness knob
    // took a factor of five out of Pass A's cross-products (20,270 -> 4,054;
    // the total 44,846 -> 28,630, Pass B unchanged at 24,576). The floor keeps
    // its job - above EITHER PASS ALONE, so it can be cleared only when both
    // passes really ran - and 25,000 is above Pass B's 24,576 and six times
    // Pass A's 4,054. It is a literal because `expectedA` and `expectedB` are
    // derived from the same racks the passes read and are asserted equal above.
    expect(
      examined,
      "the compiler cross-product is not trivial",
      // 24,438 since change 12b (2026-09-18): RADAR's 2,688 preset states
      // left for the Lua pass, so the floor is 24,000.
    ).toBeGreaterThan(24000);
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
    // THE WIDE KNOBS (change 8, 2026-09-18): a knob past the one-character
    // ceiling rides TWO characters and is guarded by the wide ceiling instead;
    // ORBIT's four ring notes are the only ones, and the count says so.
    let wide = 0;
    for (const entry of entries) {
      for (const knob of stampKnobs(entry)) {
        if (isColour(knob)) {
          exempted += 1;
          continue;
        }
        if (isWide(knob)) {
          expect(
            knob.options.length,
            `${entry.id}/${knob.id} has ${knob.options.length} options, past the two-character ceiling`,
          ).toBeLessThanOrEqual(STAMP_WIDE_CEILING);
          wide += 1;
          continue;
        }
        expect(
          knob.options.length,
          `${entry.id}/${knob.id} has ${knob.options.length} options, past the one-character ceiling`,
        ).toBeLessThanOrEqual(STAMP_OPTION_CEILING);
        guarded += 1;
      }
    }
    expect(
      wide,
      "the wide knobs: ORBIT's four ring notes and, since change 17, every output's Number (0..127)",
    ).toBe(36);
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
    //
    // RE-COUNTED BY PLAN 11-14 (RADAR POINTS, under the user's answer
    // `new-entry`), found the same way and not in that plan's file list
    // either. SONAR's rack reused: FIVE knobs, ONE of them colour, so the
    // hand-authored knob total goes 97 to 102, `exempted` 32 to 33 and
    // `guarded` 65 to 69. It still reconciles: 69 + 33 is 102. The member
    // list is still "4 19".
    //
    // RE-COUNTED BY PLAN 12-04, THE FIRST WAVE TO MOVE THESE NUMBERS DOWN, and
    // not in that plan's blast-radius table either - found the same way, by
    // running the sweep, which is now the fourth wave in a row to find this
    // line by running it rather than by reading a table. LATTICE (six knobs,
    // one colour), SHUTTLE (six, two) and FORGE (five, three) left on the
    // second bench round, so the hand-authored knob total goes 102 to 85,
    // `exempted` 33 to 27 and `guarded` 69 to 58. It still reconciles:
    // 58 + 27 is 85. The floor of 50 still guards - it has eight to spare - so
    // it is NOT re-chosen, which is the whole point of its being a floor. The
    // member list is still "4 19".
    //
    // RE-COUNTED BY PLAN 12-10, upwards by one entry, and found the same way
    // again. TRACKPAD replaced the tpad preset as the card: FOUR knobs, ONE of
    // them colour (the edge flash's), so the hand-authored knob total goes 85
    // to 89, `exempted` 27 to 28 and `guarded` 58 to 61. It still reconciles:
    // 61 + 28 is 89. The floor of 50 still guards with eleven to spare. The
    // member list is still "4 19".
    //
    // RE-COUNTED 2026-09-17 (TRACKPAD COMET, BENCH-2026-09-16.txt section 4),
    // upwards by one entry and found the same way. FOUR knobs, TWO of them
    // colour (the trail's and the head's), so the hand-authored knob total
    // goes 89 to 93, `exempted` 28 to 30 and `guarded` 61 to 63. It still
    // reconciles: 63 + 30 is 93. The member list is still "4 19".
    //
    // RE-COUNTED 2026-09-18 (change 8, BENCH-2026-09-16.txt section 8): EUCLID
    // (six knobs, one colour) became ORBIT (fourteen: six narrow, FOUR wide -
    // the ring notes, 128 each - and FOUR colour), so the hand-authored knob
    // total goes 93 to 101, `exempted` 30 to 33, `guarded` 63 to 64 and the
    // new `wide` is 4. It still reconciles: 64 + 4 + 33 is 101. The member list
    // is still "4 19".
    //
    // RE-COUNTED 2026-09-18 (change 12b, section 12): RADAR rebuilt as a Lua
    // card - five knobs, one colour - so `exempted` goes 33 to 34; the
    // member list is still "4 19".
    expect(guarded, "knobs still behind the ceiling").toBeGreaterThan(50);
    expect(exempted, "the colour knobs, exempt by format").toBe(34);

    // PASS A. Every narrow non-colour knob cross-producted, colour and wide
    // knobs at their defaults, through the real encoder and the real decoder.
    const expectedA = entries.reduce(
      (n, entry) => n + sizeOf(narrow(stampKnobs(entry))),
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
        colours > 0 ? luaColourPayloadLength(knobs) : luaPayloadLength(knobs);
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
          at += fieldChars(knob);
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

    // PASS C (change 8). Every position of every wide knob, everything else
    // at its default, then the corner with every wide knob at its last
    // position - through the real encoder and decoder, as Pass A.
    const expectedC = entries.reduce((n, entry) => {
      const wideOnes = wideKnobs(stampKnobs(entry));
      return (
        n +
        wideOnes.reduce((m, knob) => m + knob.options.length, 0) +
        (wideOnes.length > 1 ? 1 : 0)
      );
    }, 0);
    const examinedC = roundTrip(entries, passC, () => undefined);

    const examined = examinedA + examinedB + examinedC;
    const seconds = ((performance.now() - started) / 1000).toFixed(1);

    say("");
    say("stamp round-trip sweep - the Lua route, three passes");
    for (const entry of entries) {
      const knobs = stampKnobs(entry);
      const colours = colourKnobs(knobs).length;
      say(
        `  ${entry.id.padEnd(10)} passA ${String(sizeOf(narrow(knobs))).padStart(6)}` +
          `  passB ${String(colours * COLOUR_LATTICE_SIZE).padStart(6)}` +
          `  passC ${String(wideKnobs(knobs).reduce((m, k) => m + k.options.length, 0) + (wideKnobs(knobs).length > 1 ? 1 : 0)).padStart(4)}` +
          `  format ${colours > 0 ? "w" : "x"}` +
          `  payload ${colours > 0 ? luaColourPayloadLength(knobs) : luaPayloadLength(knobs)} characters`,
      );
    }
    say(
      `  Pass A ${examinedA} vectors (format w ${formatW}, format x ${formatX}), ` +
        `Pass B ${examinedB} colours, Pass C ${examinedC} wide positions, total ${examined}, ${seconds}s`,
    );

    expect(examinedA, "Pass A's enumeration silently shrank").toBe(expectedA);
    expect(examinedB, "Pass B's enumeration silently shrank").toBe(expectedB);
    expect(examinedC, "Pass C's enumeration silently shrank").toBe(expectedC);
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
