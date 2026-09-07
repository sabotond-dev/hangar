// The CONT-02 gate: everything a hand-authored configuration must be true of
// before it is allowed into the catalog.
//
// Six tests, and the count NEVER MOVES. Every one of them loops over the Lua
// entries internally and names the entry and the event in its message, so waves
// 5 and 6 add configurations without touching a single number here or in
// 08-VALIDATION.md. Nothing here is parameterised by the runner, for the same
// reason: a per-entry test block would make the total move with the catalog.
//
// WHY THIS FILE IS NAMED *.sweep.spec.ts (D-08, plan 09-01). It measures 283
// knob combinations through the WASM minifier - test 6 alone renders every
// value of every knob plus both corners of every entry, and calls
// compressScript on each of the two events - which makes it the load-sensitive
// test of the quick run. docs/TESTING.md records it timing out three times on
// 2026-09-05 at 0.8 to 1.7 GB free, on a tree that had not changed a vitest
// file. Phase 9 roughly quadruples the entry count, so it moved before that
// happened, while the move was still a rename.
//
// The move IS the rename. vite.config.ts was not edited: the `server` project
// already excludes src/**/*.sweep.spec.ts and the `sweep` project already
// includes it, by a FILE-NAME rule both that file and src/lib/config-shape.spec.ts
// state in prose. The naming convention is the rule, so honouring it costs no
// configuration.
//
// NOTHING IT COVERS WAS TRIMMED. Six tests before, six tests after, the same
// 283 combinations. Phase 8's D-10 set the precedent when it moved
// pad-invariants.test.js for exactly this reason, in exactly these words: it
// runs less OFTEN, never less FULLY. A wave authoring configurations runs it
// directly:
//
//   npx vitest run --project sweep src/lib/catalog/lua-entries.sweep.spec.ts
//
// WHY THE FORMATTER GATE IS THE FIRST THING THAT HAPPENS. compressScript throws
// before the WASM Lua formatter resolves, and checkSyntax silently returns false
// - so a gate that skipped padReady() would report every correct configuration
// as broken, and the syntax test would be a permanent, meaningless red.
//
// WHY EVERY NEEDLE IN TEST 4 IS ASSEMBLED FROM FRAGMENTS. That test forbids a
// set of Lua constructs, and a spec that searches for a string it also contains
// finds itself. src/lib/protocol/forbidden-instructions.spec.ts established the
// house answer: build the needle at runtime from pieces. The same rule applies
// to the PROSE here, which is why the list below describes each construct
// instead of naming it - a comment naming one verbatim would put the literal
// back in the file and quietly defeat the whole arrangement.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
import { measureLua, padReady } from "../pad";
import { renderLua } from "../sim/lua-pad-sim";
import { CATALOG, type CatalogEntry, type LuaKnob } from "./index";

const EVENTS = ["setup", "timer"] as const;
type EventName = (typeof EVENTS)[number];

/** The hand-authored entries. Empty is a failure, asserted in every test. */
function luaEntries(): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.source.kind === "lua");
}

/** One event's TEMPLATE - tokens still in place. Never measured directly. */
function templateOf(entry: CatalogEntry, event: EventName): string {
  const source = entry.source;
  if (source.kind !== "lua") throw new Error(`${entry.id}: not a lua entry`);
  return event === "setup" ? source.setup : source.timer;
}

/** The selected index for a knob at the entry's own defaults. */
function defaultIndex(entry: CatalogEntry, knob: LuaKnob): number {
  return entry.defaults[knob.id] ?? knob.default;
}

function defaultIndices(entry: CatalogEntry): Record<string, number> {
  const out: Record<string, number> = {};
  for (const knob of entry.knobs) out[knob.id] = defaultIndex(entry, knob);
  return out;
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function extremeIndex(knob: LuaKnob, longest: boolean): number {
  let best = 0;
  for (let i = 1; i < knob.values.length; i += 1) {
    const better = longest
      ? knob.values[i].length > knob.values[best].length
      : knob.values[i].length < knob.values[best].length;
    if (better) best = i;
  }
  return best;
}

// THE @ TRAP. The event marker every stored configuration opens with contains
// an @ of its own, in lower case. A leftover-token check of the form "no @
// remains" is therefore permanently red. The token grammar is
// ^@[A-Z][A-Z0-9_]*$, so an @ followed by an UPPER-CASE letter is the only
// shape that can be a live token, and the marker cannot collide with it.
const LIVE_TOKEN = /@[A-Z]/;

// Assembled at runtime, never written out. See the header.
const F = (...parts: string[]): string => parts.join("");

/**
 * Constructs outside the restricted Lua subset (D-08).
 *
 * The subset is the part of the language whose semantics are identical in Lua
 * 5.3, 5.4 and 5.5, so the VM-versus-firmware question is closed by
 * construction rather than by reasoning. This list is what closes it: each
 * entry is a REASON, not a preference.
 */
const FORBIDDEN: readonly { needle: string; why: string }[] = [
  {
    needle: F("math", ".", "ran", "dom"),
    why:
      "the random source - compiled into the firmware VM but weakly seeded on " +
      "ESP-IDF, so the same unrepeatable-looking field recurs after a power " +
      "cycle. No candidate needs it: arithmetic scatter is what makes a field " +
      "look unrepeatable",
  },
  {
    needle: F("str", "ing", "."),
    why: "the text library - absent from the firmware build",
  },
  {
    needle: F("o", "s", "."),
    why: "the operating-system library - absent from the firmware build",
  },
  {
    needle: F("i", "o", "."),
    why: "the stream library - absent from the firmware build",
  },
  {
    needle: F("req", "uire"),
    why: "a module loader - there is no module path on the device",
  },
  {
    needle: F("dof", "ile"),
    why: "a module loader - there is no filesystem to load from",
  },
  {
    needle: F("load", "file"),
    why: "a module loader - there is no filesystem to load from",
  },
  {
    needle: F("set", "meta", "table"),
    why: "the metatable API - restricted and version-variable in the firmware VM",
  },
  {
    needle: F("get", "meta", "table"),
    why: "the metatable API - restricted and version-variable in the firmware VM",
  },
  {
    needle: F("raw", "get"),
    why: "the raw table access that comes with the metatable API",
  },
  {
    needle: F("raw", "set"),
    why: "the raw table access that comes with the metatable API",
  },
  {
    needle: F("go", "to"),
    why: "the unconditional jump - added in 5.2 and needed by no candidate",
  },
  {
    needle: F(":", ":"),
    why: "the label syntax the unconditional jump needs",
  },
];

const NAME_CHAR = /[A-Za-z0-9_]/;
const MATH = F("math", ".");
const ALLOWED_MATH = [
  "atan",
  "sqrt",
  "abs",
  "max",
  "min",
  "floor",
  "tointeger",
];

/**
 * Every index at which `needle` appears as its own token.
 *
 * A needle that starts with a name character must not be preceded by one, so
 * the stream library's prefix is not found inside a local named `radio` and the
 * operating-system library's is not found inside a call to the cosine. A needle
 * that starts with punctuation is matched plainly.
 */
function tokenIndices(text: string, needle: string): number[] {
  const guard = NAME_CHAR.test(needle[0]);
  const out: number[] = [];
  let at = text.indexOf(needle);
  while (at !== -1) {
    if (!guard || at === 0 || !NAME_CHAR.test(text[at - 1])) out.push(at);
    at = text.indexOf(needle, at + 1);
  }
  return out;
}

/** The identifier immediately after an index, e.g. the name of a math call. */
function identifierAt(text: string, at: number): string {
  let end = at;
  while (end < text.length && NAME_CHAR.test(text[end])) end += 1;
  return text.slice(at, end);
}

describe("hand-authored Lua entries (CONT-02)", () => {
  beforeAll(async () => {
    await padReady();
  });

  it("stores both events in canonical compressed form (D-11)", () => {
    // ASSERTED ON THE RENDERED TEXT, NEVER ON THE TEMPLATE. A template holds
    // live tokens, so it is not valid Lua and compressScript would fail it for
    // a reason that has nothing to do with canonical form. This is the single
    // easiest mistake to make in this file.
    //
    // The empty-Timer case needs no branch: compressScript of the empty string
    // is the empty string, which is already a fixed point. An entry that stores
    // no Timer (MORPH, wave 6) passes here unchanged.
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    for (const entry of entries) {
      const rendered = renderLua(entry);
      for (const event of EVENTS) {
        const text = rendered[event];
        expect(
          GridScript.compressScript(text),
          `${entry.id}/${event}: stored text is not a fixed point of the ` +
            "minifier, so cost() would charge the raw length and the budget " +
            "meter would be lying. Store the compressed form, not the readable one",
        ).toBe(text);
      }
    }
  });

  it("fits the event budget at its defaults, on both events", async () => {
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    for (const entry of entries) {
      const rendered = renderLua(entry);
      for (const event of EVENTS) {
        const raw = rendered[event];
        const compressed = await measureLua(raw);
        // cost() charges max(compressed, raw): the raw length wins if it is
        // larger, which is exactly why the stored form is canonical.
        const used = Math.max(raw.length, compressed);
        expect(
          compressed,
          `${entry.id}/${event}: compressed ${compressed} exceeds raw ` +
            `${raw.length}, which cannot happen for canonical text`,
        ).toBeLessThanOrEqual(raw.length);
        expect(
          used,
          `${entry.id}/${event}: ${used} characters, ` +
            `${EVENT_BUDGET - used} free of ${EVENT_BUDGET}`,
        ).toBeLessThanOrEqual(EVENT_BUDGET);
      }
    }
  });

  it("passes the pinned minifier's syntax check on both events", () => {
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    for (const entry of entries) {
      const rendered = renderLua(entry);
      for (const event of EVENTS) {
        expect(
          GridScript.checkSyntax(rendered[event]),
          `${entry.id}/${event}: the pinned minifier rejects it`,
        ).toBe(true);
      }
    }
  });

  it("stays inside the restricted Lua subset (D-08)", () => {
    // The gate FORBIDS everything outside the subset rather than reasoning
    // about equivalence between VM versions. Scanning happens on the rendered
    // text - a runtime string - so comments in the surrounding TypeScript are
    // irrelevant to it, and every needle below was built from fragments so this
    // file does not contain what it rejects.
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    for (const entry of entries) {
      const rendered = renderLua(entry);
      for (const event of EVENTS) {
        const text = rendered[event];
        for (const rule of FORBIDDEN) {
          expect(
            tokenIndices(text, rule.needle).length,
            `${entry.id}/${event}: uses ${rule.why}`,
          ).toBe(0);
        }
        for (const at of tokenIndices(text, MATH)) {
          const name = identifierAt(text, at + MATH.length);
          expect(
            ALLOWED_MATH.includes(name),
            `${entry.id}/${event}: the numeric library call "${name}" is not ` +
              `one of ${ALLOWED_MATH.join(", ")}, so its result may differ ` +
              "between VM versions",
          ).toBe(true);
        }
      }
    }
  });

  it("keeps its knob tokens live, distinct and separable", () => {
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    for (const entry of entries) {
      const base = renderLua(entry);
      const indices = defaultIndices(entry);

      for (const knob of entry.knobs) {
        const inSetup = occurrences(templateOf(entry, "setup"), knob.token);
        const inTimer = occurrences(templateOf(entry, "timer"), knob.token);
        expect(
          inSetup + inTimer,
          `${entry.id}/${knob.id}: token "${knob.token}" appears in neither ` +
            "event, so the knob moves nothing",
        ).toBeGreaterThan(0);

        // A VALUE that looked like a token would be substituted in and then
        // either leave a live token behind for the next knob's pass or be eaten
        // by it - order-dependent, silent, and exactly the class of bug the
        // leftover check exists to catch. Asserted on the values themselves,
        // before anything is rendered.
        for (const value of knob.values) {
          expect(
            LIVE_TOKEN.test(value),
            `${entry.id}/${knob.id}: the value "${value}" looks like a ` +
              "substitution token",
          ).toBe(false);
        }
      }

      for (const event of EVENTS) {
        expect(
          LIVE_TOKEN.test(base[event]),
          `${entry.id}/${event}: a live token survived rendering at the ` +
            "defaults",
        ).toBe(false);
      }

      // THE SEPARABILITY IDENTITY, PER EVENT. Moving one knob changes one
      // event's length by exactly (occurrences in THAT event) times the
      // difference in value length. occurrences is counted per event and never
      // across both: several knobs appear in only one of the two, so a single
      // cross-event count would be wrong for almost every knob and would happen
      // to be right for the one that appears once in each.
      //
      // This is what licences the corner-only bound in the next test: it proves
      // the substitution is pure literal arithmetic with no interaction between
      // knobs, so the maximum over the whole cross-product is the all-longest
      // corner.
      for (const knob of entry.knobs) {
        const from = knob.values[indices[knob.id]];
        for (let i = 0; i < knob.values.length; i += 1) {
          const to = knob.values[i];
          const moved = renderLua(entry, { ...indices, [knob.id]: i });
          for (const event of EVENTS) {
            const occ = occurrences(templateOf(entry, event), knob.token);
            expect(
              moved[event].length,
              `${entry.id}/${event}: moving ${knob.id} from "${from}" to ` +
                `"${to}" (${occ} occurrence(s) in this event) did not change ` +
                "the length by pure literal arithmetic",
            ).toBe(base[event].length + occ * (to.length - from.length));
          }
        }
      }
    }
  });

  it("stays canonical and in budget across the whole knob cross-product", async () => {
    // THERE IS NO RUNTIME FIT LADDER FOR A LUA ENTRY (D-12). The whole
    // cross-product is proven to fit at build time, right here, which is why
    // TUNE-04's "we trimmed something" line can never fire for one of these
    // cards. That is the Phase 5 seam, and it is a comment rather than an
    // assertion because a ladder that does not exist cannot be asserted about.
    //
    // The cross-product itself is not enumerated - it is the product of the
    // knob arities, which for a six-knob entry is thousands of combinations.
    // The previous test's separability identity is what reduces it to three
    // families: every single-knob variation, and the two corners.
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    let measured = 0;
    for (const entry of entries) {
      const indices = defaultIndices(entry);
      const combinations: { label: string; knobs: Record<string, number> }[] =
        [];

      for (const knob of entry.knobs) {
        for (let i = 0; i < knob.values.length; i += 1) {
          combinations.push({
            label: `${knob.id}="${knob.values[i]}"`,
            knobs: { ...indices, [knob.id]: i },
          });
        }
      }

      const longest: Record<string, number> = {};
      const shortest: Record<string, number> = {};
      for (const knob of entry.knobs) {
        longest[knob.id] = extremeIndex(knob, true);
        shortest[knob.id] = extremeIndex(knob, false);
      }
      combinations.push({ label: "every knob at its longest", knobs: longest });
      combinations.push({
        label: "every knob at its shortest",
        knobs: shortest,
      });

      const expected =
        entry.knobs.reduce((n, knob) => n + knob.values.length, 0) + 2;
      expect(
        combinations.length,
        `${entry.id}: the sweep covers every value plus both corners`,
      ).toBe(expected);

      for (const combination of combinations) {
        const rendered = renderLua(entry, combination.knobs);
        for (const event of EVENTS) {
          const text = rendered[event];
          // Carried through the WHOLE sweep, not only the defaults: a knob
          // whose token is missing from one event's template renders correctly
          // at the defaults and leaves a live token behind the moment that knob
          // moves.
          expect(
            LIVE_TOKEN.test(text),
            `${entry.id}/${event} at ${combination.label}: a live token ` +
              "survived rendering",
          ).toBe(false);
          expect(
            GridScript.compressScript(text),
            `${entry.id}/${event} at ${combination.label}: not canonical`,
          ).toBe(text);
          const used = Math.max(text.length, await measureLua(text));
          expect(
            used,
            `${entry.id}/${event} at ${combination.label}: ${used} ` +
              `characters, ${EVENT_BUDGET - used} free of ${EVENT_BUDGET}`,
          ).toBeLessThanOrEqual(EVENT_BUDGET);
          measured += 1;
        }
      }
    }
    expect(measured, "the sweep measured something").toBeGreaterThan(0);
    // AN EXPLICIT TIMEOUT, THE SAME IDIOM src/lib/tune/reachability.sweep.spec.ts
    // USES AT ITS OWN LONG TEST. Vitest's default is 5,000 ms, which is a
    // sensible number for a unit test and the wrong number for an exhaustive
    // sweep. This test was 1.47 s at seven hand-authored entries and 283 knob
    // combinations; at twenty-seven entries and 701 combinations it measures
    // 3.89 s run alone, and on 2026-09-07 it failed `npm run test:sweep` and
    // `npm run test:unit` with `Test timed out in 5000ms` whenever the machine
    // dropped below about 0.6 GB of free memory. NOTHING HERE IS SAMPLED OR
    // TRIMMED TO FIT - that is the D-08 and D-10 rule - so the number that moves
    // is the timeout. 600,000 ms is the sibling sweep's value and it is a
    // ceiling, not a budget: exceeding it means something is genuinely wrong.
  }, 600000);
});
