// The stamp's spec: nine tests, and the count does not move with the CATALOG.
//
// Every test loops over the catalog internally and names the offending entry in
// its assertion message, so a configuration added in a later phase changes no
// number here (05-VALIDATION, "The design decision that shapes every count").
//
// THE COUNT WENT EIGHT TO NINE IN PLAN 11-09, AND THE RULE IT DOES NOT BREAK.
// The rule above is about the CATALOG: adding, removing or retuning an entry
// must not move a number in this file, and it still does not. Test 9 is a new
// INVARIANT rather than a new entry - that appending values to a knob leaves
// the old indices pointing where they always pointed - and it could not ride
// inside an existing test the way plan 10-08's captured fixture rode inside
// test 7, because it asserts something no other test here asks: the mapping
// from payload character to knob VALUE, on a knob that has been resized.
//
// TEST 5 IS THE ONE THAT MATTERS. `decodeStamp("pdial")` succeeds on its own,
// so nothing in the vendored codec stops `/playground/aurora/#z.pdial` from rendering
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
import {
  CATALOG,
  byId,
  portedEntry,
  type CatalogEntry,
  type LuaKnob,
} from "../catalog";
import { LATTICE_SIZE, cellOf, latticeSample } from "../catalog/lattice";
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
  fieldChars,
  parseHash,
  readLuaColourPayload,
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

/**
 * The ids the fixture captured that the catalog has since RENAMED (change 8, 2026-09-18: EUCLID is
 * ORBIT, the fourteenth dead address). The fixture is not regenerated - its records are history - so
 * a captured id is read under the entry that carries it now, and what its stamps land is declared
 * where the loop reads them.
 */
const RENAMED: Readonly<Record<string, string>> = { euclid: "orbit" };

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
      // A lattice colour knob (change 19) at its own colours and the 27 sampled cells here; the
      // sweep's Pass D walks all 4,096.
      for (const knob of knobs) {
        const rungs =
          knob.kind === "colour" && knob.options.length === LATTICE_SIZE
            ? latticeSample({ values: knob.options, palette: knob.palette })
            : [...knob.options.keys()];
        for (const at of rungs) {
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
        // One character per knob, three per colour and TWO per wide knob (change 8: ORBIT's four
        // ring notes), plus the format and the shape - `fieldChars` is the one rule for all three.
        expect(
          payload?.length,
          `${each.id} at ${vector.label}: one character per knob, three per colour and two per wide knob, plus the format and the shape`,
        ).toBe(2 + knobs.reduce((n, knob) => n + fieldChars(knob), 0));
        expect(
          colours * (COLOUR_FIELD_CHARS - 1),
          `${each.id}: every colour knob is three characters`,
        ).toBe(
          knobs
            .filter((knob) => knob.kind === "colour")
            .reduce((n, knob) => n + fieldChars(knob) - 1, 0),
        );
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
    const each = entry("orbit");
    const knobs = stampKnobs(each);
    expect(knobs.length, "orbit has knobs").toBeGreaterThan(1);
    const payload = encodeFor(each, tunedOf(each));
    expect(payload, "orbit encodes").toEqual(expect.any(String));

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

  it("lands a link minted before change 19 older on every card whose colour knobs became the lattice", () => {
    // CAPTURED 2026-09-24 at 0f8c474 with the encoder as it stood, each card's colour knobs one
    // rung past their defaults (ring 1 on 255,90,0, ...). The payload is the same length - format w
    // already gave a colour three characters - and every colour it carries still names a rung (its
    // cell), but the rack's shape moved (4,096 rungs where five were), so the link lands `older`:
    // the known pattern of a resized knob, the card at its defaults, never a silently wrong restore.
    const MINTED: readonly {
      id: string;
      payload: string;
      moved: Record<string, string>;
    }[] = [
      {
        id: "orbit",
        payload: "w930f50fff0cf70f10114161a1e001001001001",
        moved: {
          ring1Colour: "255,90,0",
          ring2Colour: "255,255,255",
          ring3Colour: "0,200,255",
          ring4Colour: "120,0,255",
        },
      },
      {
        id: "chorus",
        payload: "w0000f40200",
        moved: {
          bloomColour: "255,60,0",
        },
      },
      {
        id: "arc",
        payload: "w0f270fff010301",
        moved: {
          swirlColour: "255,40,120",
          heartColour: "255,255,255",
        },
      },
      {
        id: "ghost",
        payload: "w70cff804000000000h",
        moved: {
          recordColour: "0,200,255",
          ghostColour: "255,140,0",
        },
      },
      {
        id: "morph",
        payload: "wifff20010201000h1000i1000j1",
        moved: {
          trailColour: "255,255,255",
        },
      },
      {
        id: "sonar",
        payload: "wp02f472001",
        moved: {
          sweepColour: "255,60,120",
        },
      },
      {
        id: "steps",
        payload: "w02204f50201009010915109161091710918109191091a1091b1",
        moved: {
          armed: "40,0,60",
          sweep: "255,90,0",
        },
      },
      {
        id: "console",
        payload: "wi000f50234f5001",
        moved: {
          level: "255,90,0",
          rail: "40,50,60",
          mute: "255,80,0",
        },
      },
      {
        id: "strip",
        payload: "w3000f50fff1030100021",
        moved: {
          bar: "255,90,0",
          vernier: "255,255,255",
          rail: "25,0,50",
        },
      },
      {
        id: "lumen",
        payload: "wn000fec201000h1",
        moved: {
          cursor: "255,240,200",
        },
      },
      {
        id: "stage",
        payload: "wc00f07322",
        moved: {
          live: "255,0,120",
          zone: "50,40,30",
        },
      },
      {
        id: "snake",
        payload: "wf10cff0700000014",
        moved: {
          body: "0,200,255",
          food: "255,0,120",
        },
      },
      {
        id: "pomodoro",
        payload: "wh2f210fb0000001g",
        moved: {
          ring: "255,30,10",
          break: "0,255,180",
        },
      },
      {
        id: "wheels",
        payload: "we000fff0f7750101100g1",
        moved: {
          pitch: "255,255,255",
          mod: "0,255,120",
          divider: "120,90,0",
        },
      },
      {
        id: "radar-points",
        payload: "wc02f47201001",
        moved: {
          sweepColour: "255,60,120",
        },
      },
      {
        id: "trackpad",
        payload: "w80fff10",
        moved: {
          colour: "255,255,255",
        },
      },
      {
        id: "trackpad-comet",
        payload: "w9ffffff00",
        moved: {
          colour: "255,255,255",
          head: "255,255,255",
        },
      },
      {
        id: "radar",
        payload: "wg06f10001001000h1",
        moved: {
          colour: "0,110,255",
        },
      },
      {
        id: "ninepads",
        payload: "wgf400100101",
        moved: {
          colour: "255,68,0",
        },
      },
    ];
    for (const minted of MINTED) {
      const each = entry(minted.id);
      const knobs = stampKnobs(each);
      const read = readLuaColourPayload(knobs, minted.payload);
      expect(
        read,
        `${minted.id}: the minted payload still parses`,
      ).toBeDefined();
      for (const [id, literal] of Object.entries(minted.moved)) {
        const knob = knobs.find((k) => k.id === id);
        expect(knob?.options.length, `${minted.id}.${id} is the lattice`).toBe(
          LATTICE_SIZE,
        );
        const c = read?.colours[id];
        expect(
          c && cellOf(`${c.r},${c.g},${c.b}`),
          `${minted.id}.${id}: the minted colour's cell is ${literal}'s`,
        ).toBe(cellOf(literal));
      }
      expect(
        decodeFor(each, minted.payload),
        `${minted.id}: a link minted before change 19 lands older`,
      ).toEqual({ kind: "older" });
    }
  });

  it("refuses every malformed payload as unreadable", () => {
    const each = entry("orbit");
    const knobs = stampKnobs(each);
    const good = encodeFor(each, tunedOf(each));
    if (typeof good !== "string") throw new Error("orbit did not encode");

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
    const orbit = entry("orbit");

    const lua = encodeFor(orbit, tunedOf(orbit));
    if (typeof lua !== "string") throw new Error("orbit did not encode");
    // `orbit` carries four ring colour knobs, so it emits `w`. Both HANGAR letters
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
      decodeFor(orbit, compiler),
      "a BOTOR format under a Lua entry must be unreadable",
    ).toEqual({ kind: "unreadable" });
    expect(
      decodeFor(orbit, "paurora"),
      "a preset stamp under a Lua entry must be unreadable",
    ).toEqual({ kind: "unreadable" });

    // RADAR, change 12b (2026-09-18, BENCH-2026-09-16.txt section 12): the
    // ported preset rebuilt as a Lua card under the SAME id, so every link
    // shared while it was a preset card - its base-card `pradar` and any tuned
    // BOTOR stamp of its three knobs - now arrives under the Lua route. Both
    // land unreadable and open the card at its defaults: never restored with a
    // rack it does not have, never older (a shape it never had). The shelf
    // preset still encodes them, through portedEntry, so the assertion reads
    // real stamps rather than typed ones.
    const radar = entry("radar");
    expect(radar.preview, "RADAR is a Lua card since change 12b").toBe("lua");
    const shelfRadar = portedEntry("radar");
    if (!shelfRadar || shelfRadar.source.kind !== "preset")
      throw new Error("the shelf lost the radar preset");
    expect(
      encodeStamp(baseStateFor(shelfRadar)),
      "the shelf card's own base-card link",
    ).toBe("pradar");
    expect(
      decodeFor(radar, "pradar"),
      "an old RADAR base-card link under the Lua card must be unreadable",
    ).toEqual({ kind: "unreadable" });
    const oldTuned = encodeFor(shelfRadar, tunedOf(shelfRadar));
    if (typeof oldTuned !== "string") throw new Error("radar did not encode");
    expect(
      HANGAR_FORMAT_LETTERS,
      "a BOTOR payload, not a HANGAR format letter",
    ).not.toContain(oldTuned[0]);
    expect(
      decodeFor(radar, oldTuned),
      "an old tuned RADAR link under the Lua card must be unreadable",
    ).toEqual({ kind: "unreadable" });
    // And the Lua card's own tuned stamp, which the old preset card could not
    // have read either: the two routes stay symmetric under one id.
    const newTuned = encodeFor(radar, tunedOf(radar));
    if (typeof newTuned !== "string") throw new Error("radar did not encode");
    expect(
      newTuned[0],
      "the Lua card emits format w (it has a colour knob)",
    ).toBe(HANGAR_FORMAT_LUA_COLOUR);
    expect(
      decodeFor(shelfRadar, newTuned),
      "the Lua card's stamp under the shelf preset must be unreadable",
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
    // Thirty records: every one of the fifteen hand-authored entries that
    // survived plan 11-01's nine removals AND plan 12-04's three, at its
    // defaults, where the payload is null because a URL with no fragment IS
    // the base configuration, and at a wild vector with every knob at its last
    // position. Thirteen of those fifteen now EMIT `w`; CULL and QUADRANT
    // declare no colour knob and so still emit `x`. All thirty must still
    // land, and a `w`-emitting entry landing its old `x` link is the whole
    // point.
    //
    // THE FIXTURE SHRANK TWICE; IT WAS NOT REGENERATED EITHER TIME. Plan
    // 11-01 deleted the eighteen records naming the nine configurations the
    // bench asked to have removed, and plan 12-04 deleted the six naming
    // LATTICE, FORGE and SHUTTLE for the same reason - the toBeDefined() below
    // asserts every record's entry is still in the catalog. Every surviving
    // payload is the byte-for-byte literal captured at commit b3f99bb, which
    // is the only thing that makes this a test against history rather than a
    // round trip of the encoder against itself.
    //
    // It rides inside this test rather than becoming a ninth, because this
    // file's header says the count never moves and 10-08's own budget is
    // +0 tests.
    let wild = 0;
    let nulls = 0;
    for (const record of WILD) {
      const indices = record.indices;
      // A captured id the catalog renamed is read under its new id (change 8:
      // EUCLID's two records under ORBIT); the fixture keeps the old one.
      const renamed = record.entry in RENAMED;
      const each = byId(RENAMED[record.entry] ?? record.entry);
      expect(each, `wild-stamps.json names ${record.entry}`).toBeDefined();
      if (!each) continue;
      if (record.payload === null) {
        // ORBIT, at change 8 (2026-09-18, BENCH-2026-09-16.txt section 8): the
        // captured EUCLID default vector names `tempo: 3` and knobs that left
        // (`ringColour`, `note`), none of the eight that arrived. At change 8
        // the reversed millisecond list put 110 at index 2, so the vector
        // encoded to a stamp; at change 8b the BPM rail puts the same 110 ms
        // step (136 BPM) back at index 3, and every departed knob reads its
        // default, so the vector IS the defaults again and carries none - the
        // plain assertion below, reached by a longer road. Not regenerated.
        if (renamed) {
          expect(
            encodeFor(each, indices),
            `${record.entry} -> ${each.id}: the captured vector is the defaults again (change 8b)`,
          ).toBeUndefined();
          nulls += 1;
          continue;
        }
        // CHORUS, at change 7 (2026-09-18, BENCH-2026-09-16.txt section 7): the
        // captured default vector names `key: 4` (48 was the fifth of eight
        // roots; it is the first of twelve now) and a `bloomSpeed` that left,
        // so the vector is no longer the defaults and encodes to a stamp. The
        // entry's OWN defaults still carry none, which is what the record's
        // null payload asserted; the fixture is not regenerated.
        if (record.entry === "chorus") {
          expect(
            encodeFor(each, indices),
            "chorus: the captured vector is no longer the defaults (change 7)",
          ).toBeDefined();
          expect(
            encodeFor(each, each.defaults),
            "chorus: its own defaults must still carry no stamp",
          ).toBeUndefined();
          nulls += 1;
          continue;
        }
        // STEPS, at change 17B (2026-09-23, BENCH-2026-09-16.txt section 17): its channel grew
        // from four rungs (0, 1, 9, 15) to the sixteen in order, so the default channel 9 moved
        // from index 2 to index 9. The captured default vector names `channel: 2`, which is
        // channel 2 now - no longer the defaults, so it encodes to a stamp. The entry's OWN
        // defaults still carry none; the fixture is not regenerated.
        if (record.entry === "steps") {
          expect(
            encodeFor(each, indices),
            "steps: the captured vector is no longer the defaults (change 17B)",
          ).toBeDefined();
          expect(
            encodeFor(each, each.defaults),
            "steps: its own defaults must still carry no stamp",
          ).toBeUndefined();
          nulls += 1;
          continue;
        }
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
      // THE ONE EXCEPTION, AND IT IS A RESIZE RATHER THAN A REGRESSION.
      //
      // Plan 11-09 appended a one-minute and a five-minute interval to
      // POMODORO's @MINS on the bench's ask. Appending is the SAFE half - the
      // four old indices still name 15, 20, 25 and 50, which test 9 asserts
      // against four literals captured before the change - but it is still a
      // resize, and the shape character is a resize tripwire by construction:
      // shapeOf sums the option counts, so POMODORO's shape moved from `n` to
      // `p` and no stamp minted under the old shape can be called `restored`
      // any more. Test 3 already pins that semantics in the abstract ("a
      // resized knob must be older, never restored"); this is the first entry
      // in the tree to spend it.
      //
      // `older` is the graceful apology, not a wrong interval, and that is the
      // whole reason the character exists. THE FIXTURE IS NOT REGENERATED AND
      // NOT EDITED: the payload literal below is still the byte-for-byte
      // capture from commit b3f99bb, and the expectation moved here where the
      // reason can be written down. Every OTHER captured stamp must still land
      // restored, and a further entry appearing in either branch is a signal
      // that somebody is resizing or adding knobs casually.
      //
      // THE SECOND EXCEPTION, AND IT IS AN ADDITION RATHER THAN A RESIZE. Change
      // 6 (2026-09-17, BENCH-2026-09-16.txt section 6) gave ARC a sixth knob,
      // the LFO's wave shape. A stamp minted for five knobs is one character
      // short of a six-knob payload, and the LENGTH check is the tripwire for
      // exactly that (stamp.ts, the shape character's own comment: a knob added
      // or removed changes the payload length, which the length check catches
      // first; `older` is for a RESIZED knob). So ARC's captured wild stamp lands
      // `unreadable` - by design, never `restored` with the wrong knob count and
      // never `older` with a shape it does not have - and the fixture stays the
      // b3f99bb capture. ARC's default vector (payload null) still encodes to no
      // stamp: the missing sixth index is the default.
      // AND MORPH, at change 9 (2026-09-18, BENCH-2026-09-16.txt section 9):
      // the `Centre` knob is the sixth, appended, so its captured five-knob
      // payload is one character short and lands `unreadable` for the same
      // reason ARC's does. The fixture is not regenerated.
      // AND CHORUS, at change 7 (2026-09-18, BENCH-2026-09-16.txt section 7): a
      // knob REPLACED at the same count - `bloomSpeed` (five values) left and
      // `inversion` (two) sits at its slot; `key` was resized eight to twelve.
      // The captured wild payload carries position 4 at that slot, which is out
      // of the new knob's range, so the RANGE check lands it `unreadable` before
      // the shape character could say `older`. Never restored with a wrong
      // spread read as a wrong voicing. The fixture is not regenerated.
      // POMODORO's captured stamp landed `older` (a resized knob) until change 17B, which grew its
      // rack by four knobs and made its note wide: a longer payload, so it lands `unreadable` by
      // the length check with the grown cards below.
      // STAGE's is `older` since change 19 (2026-09-24): its two colour knobs became the RGB444
      // lattice (4,096 rungs where four were) - a resize at the same payload length, so the shape
      // character says older and the card opens at its defaults. The fixture is not regenerated.
      const resized = record.entry === "stage";
      // ORBIT joins the grown: EUCLID's six-knob `x` payload is the wrong
      // length for fourteen knobs and two wide fields (change 8), by design.
      // AND STEPS AND GHOST, at change 12 (2026-09-18, BENCH-2026-09-16.txt
      // section 12): Sync and Division appended to each rack, so a six-knob
      // and a five-knob payload are the wrong length by design. The fixture
      // is not regenerated; the two default vectors still carry no stamp.
      const grew =
        record.entry === "arc" ||
        record.entry === "morph" ||
        record.entry === "euclid" ||
        record.entry === "pomodoro" ||
        record.entry === "steps" ||
        record.entry === "ghost" ||
        record.entry === "strip" ||
        record.entry === "sonar" ||
        record.entry === "snake" ||
        record.entry === "quadrant" ||
        record.entry === "lumen" ||
        record.entry === "console";
      const replaced = record.entry === "chorus";
      expect(
        decodeFor(each, record.payload),
        resized
          ? `${record.entry}: the format x stamp ${record.payload} must land ` +
              "older - its colour knobs were resized at change 19 - and never " +
              "unreadable and never restored"
          : grew
            ? `${record.entry}: the format x stamp ${record.payload} must land ` +
              "unreadable - a sixth knob was added (arc at change 6, morph at " +
              "change 9), so a five-knob payload is the wrong length by design"
            : replaced
              ? `${record.entry}: the format x stamp ${record.payload} must land ` +
                "unreadable - a knob was replaced at change 7 and the captured " +
                "position is outside the new knob's range by design"
              : `${record.entry}: the format x stamp ${record.payload} no longer lands restored`,
      ).toEqual(
        resized
          ? { kind: "older" }
          : grew || replaced
            ? { kind: "unreadable" }
            : { kind: "restored", indices },
      );
      wild += 1;
    }
    // 18 -> 15: plan 12-04 removed LATTICE, FORGE and SHUTTLE, so six records
    // left the fixture - one default vector and one wild vector apiece.
    expect(wild, "captured format x stamps re-decoded").toBe(15);
    expect(nulls, "captured default vectors").toBe(15);
    // The fixture is only evidence if the tree has moved past it: at least one
    // captured entry must now emit a DIFFERENT format from the one recorded.
    const moved = WILD.filter((record) => {
      const each = byId(RENAMED[record.entry] ?? record.entry);
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
      // reconciled. RE-CHOSEN AGAIN IN PLAN 12-04, whose blast-radius table
      // named the same two and missed this one the same way: LATTICE, FORGE
      // and SHUTTLE all declared a colour knob and all three emitted w, so
      // this falls by three while CULL and QUADRANT stay the two that do not.
    ).toBe(13);
  });

  it("keeps Pomodoro's four original intervals on their four original indices", () => {
    // THE ONLY GUARD AGAINST THE INSERTION MISTAKE, AND THE REASON IT HAD TO
    // BE WRITTEN (plan 11-09).
    //
    // The bench asked for a one-minute and a five-minute POMODORO. Both formats
    // write ONE base-32 character per non-colour knob, BY INDEX, so where the
    // two new values went in the option list is the whole question. Appended,
    // every link ever minted keeps naming the interval it named. Inserted at
    // the front - which is what a tidy author sorting the list ascending would
    // do - a link minted at index 0 would render 1 minute where it used to
    // render 15, and NOTHING ELSE IN THIS FILE WOULD GO RED: every other test
    // here compares indices to indices, and the indices would round-trip
    // perfectly. They would simply mean something else.
    //
    // So this test compares indices to VALUES, and it does it against four
    // payload literals captured with the encoder as it stood BEFORE the append.
    // A vector built from the catalog at run time would be a tautology in the
    // same way a regenerated fixture is.
    const pom = entry("pomodoro");
    // The rack as the four payloads were captured (2026-09-09): the first five knobs, the note and
    // the channel four rungs each - change 17B grew both to 0..127 / sixteen (their old rungs
    // first, so every captured index still names its value) and appended four knobs, so today's
    // rack is longer than these payloads. The field layout is read against the captured rack; the
    // VALUE an index names is read off today's knob.
    const today = stampKnobs(pom);
    const knobs = today
      .slice(0, 5)
      .map((knob) =>
        knob.id === "note" || knob.id === "channel"
          ? { ...knob, options: knob.options.slice(0, 4) }
          : knob,
      );
    const mins = today.find((knob) => knob.id === "mins");
    expect(mins, "pomodoro still declares a mins knob").toBeDefined();
    if (!mins) return;

    // Captured on 2026-09-09, one per interval, every other knob held at
    // ring 1 / break 2 / note 3 / channel 1 so the four differ only in the
    // character under test - the third, which is the mins index.
    const CAPTURED: readonly { payload: string; minutes: string }[] = [
      { payload: "wn0f2145f31", minutes: "15" },
      { payload: "wn1f2145f31", minutes: "20" },
      { payload: "wn2f2145f31", minutes: "25" },
      { payload: "wn3f2145f31", minutes: "50" },
    ];

    for (let at = 0; at < CAPTURED.length; at += 1) {
      const each = CAPTURED[at];
      // 1. THE PAYLOAD STILL PARSES TO THE INDEX IT WAS WRITTEN WITH.
      //    readLuaColourPayload does length, range and field layout and does
      //    NOT consult the shape character, which is what makes this readable
      //    on a resized knob at all.
      const read = readLuaColourPayload(knobs, each.payload);
      expect(
        read,
        `pomodoro: the captured stamp ${each.payload} no longer parses - its ` +
          "length or its field layout moved, which is a bigger change than a " +
          "resize",
      ).toBeDefined();
      if (!read) continue;
      expect(
        read.indices.mins,
        `pomodoro: ${each.payload} was written at mins index ${at}`,
      ).toBe(at);
      // 2. THAT INDEX STILL NAMES THE INTERVAL THE LINK WAS MINTED FOR. This
      //    is the assertion. If the two new values were INSERTED rather than
      //    appended, this is where it says so, and it says it in minutes.
      expect(
        mins.options[read.indices.mins],
        `pomodoro: A SHARED LINK MUST STILL RENDER THE INTERVAL IT WAS ` +
          `SHARED FOR. ${each.payload} was minted for ${each.minutes} ` +
          `minutes at index ${at}; that index now names ` +
          `${mins.options[read.indices.mins]} minutes. The one-minute and ` +
          "five-minute values must be APPENDED to @MINS, never inserted and " +
          "never sorted in",
      ).toBe(each.minutes);
    }

    // 3. THE TWO NEW INTERVALS ARE REALLY THERE, so this test cannot pass by
    //    the append never having happened.
    expect(
      [...mins.options],
      "pomodoro: the bench asked for a one-minute and a five-minute interval",
    ).toEqual(["15", "20", "25", "50", "1", "5"]);

    // 4. AND THE LANDING IS NAMED RATHER THAN LEFT TO BE DISCOVERED. A resize
    //    moves the shape character, so these four landed `older` - the honest
    //    apology. CHANGE 17B GREW THE RACK (four knobs appended, the note wide),
    //    so a five-knob payload is the wrong length: they land `unreadable`, the
    //    known pattern of a grown rack, and the card opens at its defaults. The
    //    indices above still name their minutes; only the link is past reading.
    for (const each of CAPTURED) {
      expect(
        decodeFor(pom, each.payload).kind,
        `pomodoro: ${each.payload} lands unreadable since change 17B grew the rack`,
      ).toBe("unreadable");
    }
  });

  it("is idempotent, on both routes and through a restore", () => {
    // The consistency check IS an idempotence assertion, so a codec that were
    // not idempotent would fail test 5 for entirely the wrong reason.
    const subjects = [entry("aurora"), entry("dial"), entry("orbit")];
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
