// The stamp's spec: eight tests, and the count never moves.
//
// Every test loops over the catalog internally and names the offending entry in
// its assertion message, so a configuration added in a later phase changes no
// number here (05-VALIDATION, "The design decision that shapes every count").
//
// TEST 5 IS THE ONE THAT MATTERS. `decodeStamp("pdial")` succeeds on its own,
// so nothing in the vendored codec stops `/c/aurora/#z.pdial` from rendering
// Dial's configuration under Aurora's name plate - precisely the "subtly wrong
// one" SHARE-03 forbids. The entry-consistency check is the whole guard, it is
// one line, and its negative check (delete the line, watch Dial appear under
// aurora) was observed before this file was trusted.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import {
  STAMP_ALPHABET,
  STAMP_PREFIX,
  encodeStamp,
} from "../../vendor/botor/_pad";
import { CATALOG, byId, type CatalogEntry, type LuaKnob } from "../catalog";
import { baseStateFor } from "../tune/state";
import WILD_STAMPS from "./fixtures/wild-stamps.json" with { type: "json" };
import {
  COLOUR_FIELD_CHARS,
  HANGAR_FORMAT_LETTERS,
  HANGAR_FORMAT_LUA,
  HANGAR_FORMAT_LUA_COLOUR,
  compilerKnobs,
  decodeFor,
  encodeFor,
  parseHash,
  stampKnobs,
} from "./stamp";

type Indices = Record<string, number>;

/**
 * The captured fixture, typed ONCE at the boundary.
 *
 * A JSON import gives every record its own literal object type, so the union
 * over twenty-seven racks has an optional member for each knob id in the
 * catalog and no structural conversion to a Record reaches it. One assertion
 * here beats twenty-seven at the use sites, and it is checked at runtime by
 * the two counts the test asserts.
 */
type WildStamp = {
  entry: string;
  vector: string;
  indices: Indices;
  payload: string | null;
};
const WILD: readonly WildStamp[] =
  WILD_STAMPS.stamps as unknown as readonly WildStamp[];

const entry = (id: string): CatalogEntry => {
  const found = byId(id);
  if (!found) throw new Error(`the catalog lost ${id}`);
  return found;
};

const luaEntries = () => CATALOG.filter((each) => each.preview === "lua");
const padsimEntries = () => CATALOG.filter((each) => each.preview === "padsim");

const defaultsOf = (each: CatalogEntry): Indices => {
  const out: Indices = {};
  for (const knob of stampKnobs(each)) out[knob.id] = knob.default;
  return out;
};

/** Every knob one position off its default, which is never the default. */
const tunedOf = (each: CatalogEntry): Indices => {
  const out: Indices = {};
  for (const knob of stampKnobs(each)) {
    out[knob.id] = (knob.default + 1) % knob.options.length;
  }
  return out;
};

const sameIndices = (a: Indices, b: Indices): boolean =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.keys(a).every((key) => a[key] === b[key]);

describe("the stamp: encoding", () => {
  it("emits nothing at the defaults and a decodable payload once a knob moves", () => {
    // A URL with no fragment IS the base configuration (SHARE-01), so the
    // defaults must encode to undefined for BOTH routes, and for any entry
    // that exposes no knobs at all.
    expect(CATALOG.length, "the catalog is not empty").toBeGreaterThan(0);
    for (const each of CATALOG) {
      expect(
        encodeFor(each, defaultsOf(each)),
        `${each.id}: the defaults must carry no stamp`,
      ).toBeUndefined();
    }

    const tunable = padsimEntries().filter(
      (each) => compilerKnobs(each).length > 0,
    );
    expect(
      tunable.length,
      "there are compiler-driven entries with knobs",
    ).toBeGreaterThan(0);
    for (const each of tunable) {
      const indices = tunedOf(each);
      const payload = encodeFor(each, indices);
      expect(payload, `${each.id}: a tuned entry must carry a stamp`).toEqual(
        expect.any(String),
      );
      expect(decodeFor(each, payload), `${each.id}: did not restore`).toEqual({
        kind: "restored",
        indices,
      });
    }
  });
});

describe("the stamp: format x", () => {
  it("round-trips every Lua entry over both corners and every single move", () => {
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    let checked = 0;
    for (const each of entries) {
      const knobs = stampKnobs(each);
      const defaults = defaultsOf(each);
      const vectors: { label: string; indices: Indices }[] = [
        { label: "the defaults", indices: defaults },
        {
          label: "every knob at its first value",
          indices: Object.fromEntries(knobs.map((knob) => [knob.id, 0])),
        },
        {
          label: "every knob at its last value",
          indices: Object.fromEntries(
            knobs.map((knob) => [knob.id, knob.options.length - 1]),
          ),
        },
      ];
      for (const knob of knobs) {
        for (let at = 0; at < knob.options.length; at += 1) {
          vectors.push({
            label: `${knob.id} at ${at}`,
            indices: { ...defaults, [knob.id]: at },
          });
        }
      }

      for (const vector of vectors) {
        const payload = encodeFor(each, vector.indices);
        if (sameIndices(vector.indices, defaults)) {
          expect(
            payload,
            `${each.id} at ${vector.label}: this vector IS the defaults`,
          ).toBeUndefined();
          checked += 1;
          continue;
        }
        // THE SPLIT (plan 10-08). An entry that carries a colour knob emits
        // format `w` - three characters for a colour, one for everything else
        // - and an entry that carries none still emits `x`, unchanged. The
        // expectation is DERIVED from the rack rather than restated, so the
        // day an entry gains or loses a colour knob this test follows it
        // instead of going red for a reason that is not a fault.
        const colours = knobs.filter((knob) => knob.kind === "colour").length;
        const format =
          colours > 0 ? HANGAR_FORMAT_LUA_COLOUR : HANGAR_FORMAT_LUA;
        expect(
          payload?.[0],
          `${each.id} at ${vector.label}: ${colours} colour knob(s) must emit format ${format}`,
        ).toBe(format);
        expect(
          payload?.length,
          `${each.id} at ${vector.label}: one character per knob and three per colour, plus the format and the shape`,
        ).toBe(2 + knobs.length + colours * (COLOUR_FIELD_CHARS - 1));
        expect(
          decodeFor(each, payload),
          `${each.id} at ${vector.label}: did not round-trip`,
        ).toEqual({ kind: "restored", indices: vector.indices });
        checked += 1;
      }
    }
    expect(checked, "the sample is not empty").toBeGreaterThan(20);
  });

  it("lands older on a resized knob and never restored on a changed rack", () => {
    // The shape character is a tripwire, not a hash: it turns a RESIZED knob
    // into a graceful failure. An ADDED or REMOVED knob moves the payload
    // LENGTH as well, which the length check catches first and reports as
    // unreadable - both are honest, and neither is a silently wrong restore.
    const each = entry("euclid");
    const knobs = stampKnobs(each);
    expect(knobs.length, "euclid has knobs").toBeGreaterThan(1);
    const payload = encodeFor(each, tunedOf(each));
    expect(payload, "euclid encodes").toEqual(expect.any(String));

    const resized: CatalogEntry = {
      ...each,
      knobs: each.knobs.map((knob, at) =>
        at === 0
          ? { ...knob, values: knob.values.slice(0, knob.values.length - 1) }
          : knob,
      ),
    };
    const spare: LuaKnob = {
      id: "spare",
      label: "Spare",
      kind: "amount",
      token: "@SPARE",
      values: ["1", "2"],
      default: 0,
    };
    const added: CatalogEntry = { ...each, knobs: [...each.knobs, spare] };
    const removed: CatalogEntry = { ...each, knobs: each.knobs.slice(1) };

    expect(
      decodeFor(resized, payload),
      "a resized knob must be older, never restored",
    ).toEqual({ kind: "older" });
    expect(
      decodeFor(added, payload),
      "an added knob moves the payload length",
    ).toEqual({ kind: "unreadable" });
    expect(
      decodeFor(removed, payload),
      "a removed knob moves the payload length",
    ).toEqual({ kind: "unreadable" });
  });

  it("refuses every malformed payload as unreadable", () => {
    const each = entry("euclid");
    const knobs = stampKnobs(each);
    const good = encodeFor(each, tunedOf(each));
    if (typeof good !== "string") throw new Error("euclid did not encode");

    const outsideAlphabet = "w";
    expect(
      STAMP_ALPHABET.includes(outsideAlphabet),
      "the substituted character really is outside the payload alphabet",
    ).toBe(false);

    const cases: { label: string; payload: string }[] = [
      { label: "an unknown format letter", payload: `q${good.slice(1)}` },
      { label: "a payload one character short", payload: good.slice(0, -1) },
      { label: "a payload one character long", payload: `${good}0` },
      { label: "truncated to the format letter", payload: good.slice(0, 1) },
      {
        label: "a character outside the alphabet",
        payload: good.slice(0, 2) + outsideAlphabet + good.slice(3),
      },
      {
        label: "an index past the end of its values",
        payload:
          good.slice(0, 2) +
          STAMP_ALPHABET[knobs[0].options.length] +
          good.slice(3),
      },
    ];
    for (const malformed of cases) {
      expect(
        decodeFor(each, malformed.payload),
        `${malformed.label} must be unreadable`,
      ).toEqual({ kind: "unreadable" });
    }
  });
});

describe("the stamp: the entry-consistency check", () => {
  it("refuses another card's stamp and accepts this card's own base link", () => {
    const aurora = entry("aurora");
    // The whole of SHARE-03. decodeStamp("pdial") succeeds; the check is what
    // stops Dial's configuration rendering under Aurora's name.
    expect(
      decodeFor(aurora, "pdial"),
      "another card's preset stamp must be unreadable",
    ).toEqual({ kind: "unreadable" });

    // A tuned DIAL stamp, which decodes cleanly and is not this entry's.
    const dial = entry("dial");
    const foreign = encodeFor(dial, tunedOf(dial));
    if (typeof foreign !== "string") throw new Error("dial did not encode");
    expect(
      decodeFor(aurora, foreign),
      "another card's tuned stamp must be unreadable",
    ).toEqual({ kind: "unreadable" });

    // THE `p` ROW, and why it is decided BEFORE the check. `paurora` is what
    // encodeStamp emits for an untuned card, so it is exactly the stamp a
    // BOTOR base-card link carries. The check rebuilds by APPLYING knobs,
    // every apply goes through withChange, and withChange deletes
    // state.preset - so encodeStamp(rebuilt) is a field dump and can never
    // equal "paurora". Classifying that unreadable would put SHARE-03's
    // apology on a link that is perfectly correct.
    const source = aurora.source;
    if (source.kind !== "preset") throw new Error("aurora is not a preset");
    expect(
      encodeStamp(baseStateFor(aurora)),
      "the untuned card really does encode as its own preset stamp",
    ).toBe(`p${source.presetId}`);
    expect(
      decodeFor(aurora, `p${source.presetId}`),
      "this card's own base-card link lands at its defaults",
    ).toEqual({ kind: "restored", indices: defaultsOf(aurora) });
    expect(
      encodeFor(aurora, tunedOf(aurora)),
      "a tuned card is a field dump and never the preset short form, which is exactly why the p row is decided before the check",
    ).not.toBe(`p${source.presetId}`);
  });

  it("refuses each route's stamp under the other route's entry", () => {
    const aurora = entry("aurora");
    const euclid = entry("euclid");

    const lua = encodeFor(euclid, tunedOf(euclid));
    if (typeof lua !== "string") throw new Error("euclid did not encode");
    // `euclid` carries a ringColour knob, so it emits `w`. Both HANGAR letters
    // are refused under a compiler entry, and both are asserted here rather
    // than only the one this subject happens to produce.
    expect(lua[0], "the Lua route uses a HANGAR format letter").toBe(
      HANGAR_FORMAT_LUA_COLOUR,
    );
    expect(
      decodeFor(aurora, lua),
      "format w under a compiler entry must be unreadable",
    ).toEqual({ kind: "unreadable" });
    const cull = entry("cull");
    const noColour = encodeFor(cull, tunedOf(cull));
    if (typeof noColour !== "string") throw new Error("cull did not encode");
    expect(
      noColour[0],
      "a Lua entry with no colour knob still emits format x",
    ).toBe(HANGAR_FORMAT_LUA);
    expect(
      decodeFor(aurora, noColour),
      "format x under a compiler entry must be unreadable",
    ).toEqual({ kind: "unreadable" });

    const compiler = encodeFor(aurora, tunedOf(aurora));
    if (typeof compiler !== "string") throw new Error("aurora did not encode");
    expect(
      decodeFor(euclid, compiler),
      "a BOTOR format under a Lua entry must be unreadable",
    ).toEqual({ kind: "unreadable" });
    expect(
      decodeFor(euclid, "paurora"),
      "a preset stamp under a Lua entry must be unreadable",
    ).toEqual({ kind: "unreadable" });
  });
});

describe("the stamp: the envelope", () => {
  it("parses only a z. fragment, and claims four collision-proof letters", () => {
    expect(parseHash("#z.at7ghh1pv8j00")).toBe("at7ghh1pv8j00");
    expect(parseHash("#z.x5abc")).toBe("x5abc");
    expect(parseHash("#")).toBeUndefined();
    expect(parseHash("#z.")).toBeUndefined();
    expect(parseHash("#chosen")).toBeUndefined();
    expect(parseHash("?z.at7ghh1pv8j00")).toBeUndefined();
    expect(parseHash("")).toBeUndefined();
    expect(parseHash("z.at7ghh1pv8j00")).toBeUndefined();

    // The prefix is the vendored one, never a second literal.
    expect(STAMP_PREFIX).toBe("z.");
    // HANGAR's four letters are outside the base-32 payload alphabet, so
    // BOTOR's own BitWriter can never emit one as payload.
    for (const letter of HANGAR_FORMAT_LETTERS) {
      expect(
        STAMP_ALPHABET.includes(letter),
        `${letter} must be outside the payload alphabet`,
      ).toBe(false);
    }
    expect(HANGAR_FORMAT_LETTERS).toContain(HANGAR_FORMAT_LUA);
    expect(HANGAR_FORMAT_LETTERS).toContain(HANGAR_FORMAT_LUA_COLOUR);

    // ------------------------------------------------------------------
    // DECODING OF FORMAT `x` IS NEVER REMOVED, ONLY STOPPED BEING EMITTED.
    //
    // Those are the words, and this is the evidence. Every literal below was
    // written by the encoder as it stood the moment BEFORE format `w` existed
    // and committed on its own, so this is a test against captured history
    // rather than a round trip of the new encoder against itself - which would
    // assert only that the encoder agrees with itself and would pass just as
    // happily on the day `x` stopped decoding.
    //
    // Thirty-six records: every one of the eighteen hand-authored entries that
    // survived plan 11-01's nine removals, at its defaults, where the payload
    // is null because a URL with no fragment IS the base configuration, and at
    // a wild vector with every knob at its last position. Sixteen of those
    // eighteen now EMIT `w`; CULL and QUADRANT declare no colour knob and so
    // still emit `x`. All thirty-six must still land, and a `w`-emitting entry
    // landing its old `x` link is the whole point.
    //
    // THE FIXTURE SHRANK; IT WAS NOT REGENERATED. Plan 11-01 deleted the
    // eighteen records naming the nine configurations the bench asked to have
    // removed, because the toBeDefined() below asserts every record's entry is
    // still in the catalog. Every surviving payload is the byte-for-byte
    // literal captured at commit b3f99bb, which is the only thing that makes
    // this a test against history rather than a round trip of the encoder
    // against itself.
    //
    // It rides inside this test rather than becoming a ninth, because this
    // file's header says the count never moves and 10-08's own budget is
    // +0 tests.
    let wild = 0;
    let nulls = 0;
    for (const record of WILD) {
      const indices = record.indices;
      const each = byId(record.entry);
      expect(each, `wild-stamps.json names ${record.entry}`).toBeDefined();
      if (!each) continue;
      if (record.payload === null) {
        expect(
          encodeFor(each, indices),
          `${record.entry}: the defaults must still carry no stamp`,
        ).toBeUndefined();
        nulls += 1;
        continue;
      }
      expect(
        record.payload[0],
        `${record.entry}: the captured literal must be format x`,
      ).toBe(HANGAR_FORMAT_LUA);
      expect(
        decodeFor(each, record.payload),
        `${record.entry}: the format x stamp ${record.payload} no longer lands restored`,
      ).toEqual({ kind: "restored", indices });
      wild += 1;
    }
    expect(wild, "captured format x stamps re-decoded").toBe(18);
    expect(nulls, "captured default vectors").toBe(18);
    // The fixture is only evidence if the tree has moved past it: at least one
    // captured entry must now emit a DIFFERENT format from the one recorded.
    const moved = WILD.filter((record) => {
      const each = byId(record.entry);
      if (!each || record.payload === null) return false;
      return encodeFor(each, record.indices)?.[0] !== record.payload[0];
    });
    expect(
      moved.length,
      "no entry changed format, so the fixture is proving nothing",
      // Re-chosen in plan 11-01: sixteen of the eighteen surviving entries,
      // because CULL and QUADRANT declare no colour knob and still emit x.
      // The plan's blast-radius table named the two literals above and
      // missed this third one - reported in 11-01-SUMMARY.md rather than
      // reconciled.
    ).toBe(16);
  });

  it("is idempotent, on both routes and through a restore", () => {
    // The consistency check IS an idempotence assertion, so a codec that were
    // not idempotent would fail test 5 for entirely the wrong reason.
    const subjects = [entry("aurora"), entry("dial"), entry("euclid")];
    for (const each of subjects) {
      const indices = tunedOf(each);
      const once = encodeFor(each, indices);
      const twice = encodeFor(each, indices);
      expect(once, `${each.id}: encoded`).toEqual(expect.any(String));
      expect(twice, `${each.id}: encoding twice differs`).toBe(once);

      const landing = decodeFor(each, once);
      if (landing.kind !== "restored") {
        throw new Error(`${each.id}: expected a restore, got ${landing.kind}`);
      }
      expect(
        encodeFor(each, landing.indices),
        `${each.id}: re-encoding a restored vector differs`,
      ).toBe(once);
    }
  });
});
