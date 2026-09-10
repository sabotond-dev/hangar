// The touch library's three gates: what it costs, what it is called, and what
// it is allowed to say.
//
// A SERVER SPEC, BY CHOICE, AND THE SWEEP'S MEMBER LIST DOES NOT MOVE. The
// sweep project exists for the load-sensitive measurement - 1,331 knob
// combinations through the WASM minifier - and this file measures ONE string
// once. Putting it in the sweep would mean the library's cost was checked per
// wave instead of per run, on a string every re-fit in this phase calls. So it
// runs in `server`, `npm run test:sweep` stays at `4 19`, and this paragraph is
// the record that the choice was made rather than overlooked.
//
// THREE TESTS, AND THE COUNT DOES NOT MOVE WITH THE LIBRARY. Each one loops
// over the parts or the call sites internally and names what it found, so a
// seventh function - which must arrive with its caller named, see
// `library.ts` section 3 - moves no number here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
import { padReady } from "../pad";
import { HOST_GLOBALS, HOST_SELF_METHODS } from "../sim/lua-host";
import {
  LIBRARY_CONVENTIONS,
  LIBRARY_GLOBALS,
  LIBRARY_PARTS,
  LIBRARY_VERSION,
  TOUCH_LIBRARY,
} from "./library";

/**
 * The planning figures this file replaces, kept so a green run still prints the
 * arithmetic rather than only its result.
 *
 * `SUPERSEDED_RAW` is the sketch that carried `F`: eight segments and seven
 * joins, 884 raw, which the pinned minifier read as 885 - one longer, differing
 * only in the joins, which is exactly why a canonical fixed point has to be
 * taken before either number means anything.
 */
const SUPERSEDED_RAW = 884;
const SUPERSEDED_COST = 885;

/** The superseded sketch's parts, for the before column. See `library.ts`. */
const SUPERSEDED_PARTS: Readonly<Record<string, number>> = {
  "header and tables": 9 + 23,
  W: 109,
  E: 60,
  Q: 261,
  X: 74,
  A: 150,
  F: 123,
  D: 68,
};

/** Assembled at run time, never written out - `touch-guard.spec.ts`'s rule. */
const F = (...parts: string[]): string => parts.join("");

const V = "e";
const EQ = F("=", "=");
const GE = F(">", "=");
const GT = ">";
const LT = "<";
const AND = F("an", "d");
const OR = F("o", "r");

/**
 * Every firmware Lua global, from the six files `12-RESEARCH.md` §3b checked.
 *
 * CITED, NOT READ. The sibling repository is not on this machine's test path
 * and a spec that reached across it would be green here and red anywhere else,
 * so the list is transcribed once with its provenance:
 * `../grid-fw/common/src/lua/{init,events,mapsat,simplecolor,simplemidi,autovalue}.lua`,
 * read on 2026-09-10. The point of the list is its SHAPE, and the shape is the
 * whole licence for single-capital names: the shortest firmware global is
 * `EFN` at three characters (`grid_ui.c:370-383` sets it around every event
 * body), and not one of them is a single capital.
 */
const FIRMWARE_GLOBALS: readonly string[] = [
  "EFN",
  "gmaps",
  "gmrr",
  "rx_feat",
  "rx_type",
  "color_auto_layer",
  "color_auto_value",
  "color_curve",
  "event_handler_to_layer",
  "init_auto_value",
  "init_element_color",
  "init_element_midi",
  "init_element_value",
  "init_endless_color",
  "init_simple_color",
  "init_simple_midi",
  "midi_auto_ch",
  "midi_auto_cmd",
  "midi_auto_p1",
  "midi_auto_p2",
  "_decoded_eview",
  "_decoded_midi",
  "_decoded_order",
  "_decoded_rtm",
  "_decoded_sysex",
  "_events_clear",
  "_events_eleidx",
  "_events_evestr",
  "_events_process",
];

// ---------------------------------------------------------------------------
// The decay scanner, in `decay-idiom.spec.ts`'s own shape
// ---------------------------------------------------------------------------

/** One call's arguments, split at commas outside every bracket. */
function callArgs(text: string, name: string): string[] | null {
  const at = text.indexOf(name + "(");
  if (at === -1) return null;
  const open = at + name.length;
  const args: string[] = [];
  let depth = 0;
  let start = open + 1;
  for (let i = open; i < text.length; i += 1) {
    const c = text[i];
    if (c === "(" || c === "[" || c === "{") depth += 1;
    else if (c === ")" || c === "]" || c === "}") {
      depth -= 1;
      if (depth === 0) {
        args.push(text.slice(start, i));
        return args.map((a) => a.replace(/\s+/g, ""));
      }
    } else if (c === "," && depth === 1) {
      args.push(text.slice(start, i));
      start = i + 1;
    }
  }
  return null;
}

/** The body of one named library function, braces and all. */
function bodyOf(name: string): string {
  const part = LIBRARY_PARTS.find((p) => p.name === name);
  if (!part) throw new Error(`the library has no part named ${name}`);
  return part.lua;
}

// ---------------------------------------------------------------------------

describe("the touch library (CONT-02, PREV-01)", () => {
  beforeAll(async () => {
    // compressScript THROWS before the WASM formatter resolves and checkSyntax
    // silently returns false, so a gate that skipped this would report a
    // correct library as broken. Same first line as every other measuring spec.
    await padReady();
  });

  it("1. costs what it says, and is its own fixed point", () => {
    const raw = LIBRARY_PARTS.map((p) => p.lua);
    const uniform = raw.join(" ");
    const partSum = raw.reduce((n, p) => n + p.length, 0);

    // THE PLANNING ARITHMETIC, ASSERTED RATHER THAN COPIED. Seven segments
    // joined with six single spaces is the raw source length the plan carries;
    // if the parts do not sum to it, one of them is mistyped.
    expect(
      partSum + raw.length - 1,
      "the parts do not sum to the raw source",
    ).toBe(uniform.length);

    // And the delta against the superseded sketch, part by part, so the 770 is
    // derived from the change and not from the plan's paragraph.
    const now: Record<string, number> = {};
    for (const part of LIBRARY_PARTS) now[part.name] = part.lua.length;
    const before = Object.values(SUPERSEDED_PARTS).reduce((a, b) => a + b, 0);
    expect(
      before + Object.keys(SUPERSEDED_PARTS).length - 1,
      "the superseded parts do not sum to its recorded raw length",
    ).toBe(SUPERSEDED_RAW);

    const delta =
      now["Q"] -
      SUPERSEDED_PARTS["Q"] +
      (now["E"] - SUPERSEDED_PARTS["E"]) +
      (now["header and tables"] - SUPERSEDED_PARTS["header and tables"]) -
      SUPERSEDED_PARTS["F"] -
      1;
    expect(
      SUPERSEDED_RAW + delta,
      "the per-part delta does not land on the raw source length",
    ).toBe(uniform.length);

    // CANONICAL, AND THE ONE EDIT THE MINIFIER MAKES IS NAMED. The uniform join
    // is one character longer than the shipped string: the space between `P={}`
    // and `function W` is the only separator the minifier can drop, so
    // TOUCH_LIBRARY is built with the head concatenated and the six functions
    // joined. Asserting compressScript(uniform) === TOUCH_LIBRARY is what makes
    // that a measurement rather than a claim.
    expect(
      GridScript.compressScript(uniform),
      "the uniform join no longer compresses to the shipped string, so the " +
        "canonical form moved and the shipped join has to be re-derived",
    ).toBe(TOUCH_LIBRARY);
    expect(
      GridScript.compressScript(TOUCH_LIBRARY),
      "the shipped library is not a fixed point of the minifier, so cost() " +
        "would charge the raw length and the budget meter would be lying",
    ).toBe(TOUCH_LIBRARY);

    const cost = Math.max(
      TOUCH_LIBRARY.length,
      GridScript.compressScript(TOUCH_LIBRARY).length,
    );
    console.log(
      `the touch library costs ${cost} of ${EVENT_BUDGET}, ` +
        `${EVENT_BUDGET - cost} free - against ${uniform.length} raw and the ` +
        `superseded ${SUPERSEDED_COST} (${SUPERSEDED_RAW} raw). Parts: ` +
        LIBRARY_PARTS.map((p) => `${p.name} ${p.lua.length}`).join(", "),
    );
    expect(
      cost,
      `${cost} characters, ${EVENT_BUDGET - cost} free`,
    ).toBeLessThanOrEqual(EVENT_BUDGET);
    expect(
      cost,
      "the library got shorter than the superseded sketch",
    ).toBeLessThan(SUPERSEDED_COST);
    expect(
      LIBRARY_VERSION,
      "the library version is a TypeScript constant",
    ).toBe("1");
    // THE VERSION IS NOT IN THE LUA, and the way to assert that is to assert
    // the library carries no comment at all beyond the event marker: a version
    // stamp would have to be one, and a comment costs real characters out of
    // 908 because the minifier does not strip them.
    expect(
      [...TOUCH_LIBRARY.matchAll(/--/g)].length,
      "the library carries a comment beyond its event marker; the minifier " +
        "does not strip comments, so it is paying for it out of 908",
    ).toBe(1);
    expect(
      TOUCH_LIBRARY.indexOf("--"),
      "the event marker is not the head of the string",
    ).toBe(0);
  });

  it("2. names every global with one capital, defines every one it lists, and collides with nothing", () => {
    // NO `local function`. Firmware wraps each stored event body in its own
    // function (`grid_ui.c:370-383`), so a local defined in the system Setup is
    // invisible to every touch Setup that would call it - the library would
    // load clean and then raise "attempt to call a nil value" on the first
    // finger.
    expect(
      TOUCH_LIBRARY.includes(F("local", " ", "function")),
      "the library declares a local function, which no touch Setup can see",
    ).toBe(false);

    // Every definition is a single capital, and the scan is over the string.
    const defined = [
      ...TOUCH_LIBRARY.matchAll(/\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)/g),
    ].map((m) => m[1]);
    expect(defined.length, "the scan found no function definitions").toBe(6);
    for (const name of defined) {
      expect(
        /^[A-Z]$/.test(name),
        `${name} is not a single capital, and every call site pays its length`,
      ).toBe(true);
    }

    // The derived list is the definitions plus the state tables, and it is
    // DERIVED - host-surface.spec.ts admits it without a second copy.
    for (const name of defined) {
      expect(LIBRARY_GLOBALS, `${name} is defined but not derived`).toContain(
        name,
      );
    }
    for (const name of LIBRARY_GLOBALS) {
      expect(
        new RegExp(`\\b${name}\\s*[=(]`).test(TOUCH_LIBRARY),
        `${name} is in LIBRARY_GLOBALS and is defined nowhere in the string`,
      ).toBe(true);
      expect(/^[A-Z]$/.test(name), `${name} is not a single capital`).toBe(
        true,
      );
    }
    expect(LIBRARY_GLOBALS.length, "six functions and four state tables").toBe(
      10,
    );

    // EVERY SINGLE-CAPITAL CALL SITE IS ACCOUNTED FOR. The library calls one
    // name it does not define - `R`, the entry's release convention - and this
    // is where a seventh function or a second convention would have to declare
    // itself instead of arriving unannounced.
    const called = [
      ...new Set(
        [...TOUCH_LIBRARY.matchAll(/(^|[^A-Za-z0-9_.:])([A-Z])\(/g)].map(
          (m) => m[2],
        ),
      ),
    ].sort();
    const admitted = [
      ...new Set([...LIBRARY_GLOBALS, ...LIBRARY_CONVENTIONS]),
    ].sort();
    for (const name of called) {
      expect(
        admitted,
        `${name}( is called in the library and is neither defined by it nor ` +
          "declared as a convention",
      ).toContain(name);
    }
    expect(
      LIBRARY_CONVENTIONS.every((name) => called.includes(name)),
      "a declared convention is never called, so it is documentation and not " +
        "a contract: " +
        LIBRARY_CONVENTIONS.join(", "),
    ).toBe(true);
    for (const name of LIBRARY_CONVENTIONS) {
      expect(
        LIBRARY_GLOBALS,
        `${name} is declared a convention AND defined by the library`,
      ).not.toContain(name);
    }

    // NOTHING COLLIDES. A library global that shadowed a host global or a
    // firmware one would break a call site nobody edited.
    const others = [...HOST_GLOBALS, ...HOST_SELF_METHODS, ...FIRMWARE_GLOBALS];
    for (const name of [...LIBRARY_GLOBALS, ...LIBRARY_CONVENTIONS]) {
      expect(
        others,
        `${name} collides with a registered or firmware name`,
      ).not.toContain(name);
    }
    // And the shape that licenses single capitals in the first place.
    for (const name of FIRMWARE_GLOBALS) {
      expect(
        name.length,
        `${name} is a single-capital firmware global, so the library's naming ` +
          "rule has lost its licence",
      ).toBeGreaterThan(1);
    }
  });

  it("3. passes the pinned syntax check and both class gates", () => {
    expect(
      GridScript.checkSyntax(TOUCH_LIBRARY),
      "the pinned checker refuses the library",
    ).toBe(true);

    // -----------------------------------------------------------------------
    // THE CLASS-B GATE, over the string rather than over the catalog.
    // `touch-guard.spec.ts` scans hand-authored ENTRIES; the library is not one,
    // so its own Lua would go unchecked by the file whose rule it has to obey.
    // The needles are assembled from fragments, exactly as that file assembles
    // its own.
    // -----------------------------------------------------------------------

    // "this contact ended" is `e>=5 and e<9`. The library does not write one:
    // its end test is the negation of the live test, `e~=1 and e~=4 and e<9`,
    // which names 9 by admitting everything at or above it and is self-guarding.
    // Asserting ZERO sites is the honest reading, and it fails the moment an
    // unescaped one is added.
    const ended = [
      ...TOUCH_LIBRARY.matchAll(
        new RegExp(F(V, "\\s*(", GE, "|", GT, ")\\s*([0-9]+)"), "g"),
      ),
    ].filter((m) => (m[1] === GE ? m[2] === "5" : m[2] === "4"));
    for (const site of ended) {
      const after = TOUCH_LIBRARY.slice(site.index + site[0].length);
      expect(
        new RegExp(F("^\\s*", AND, "\\s*", V, "\\s*", LT, "\\s*9")).test(after),
        F(
          '"this contact ended" is written `',
          V,
          GE,
          "5 ",
          AND,
          " ",
          V,
          LT,
          "9`; a fast tap is a down AND an up, and treating it as a plain end " +
            "throws the onset away. The library writes it unescaped at index " +
            String(site.index),
        ),
      ).toBe(true);
    }
    expect(
      ended.length,
      "the library grew a 'contact ended' guard; it had none, because its end " +
        "test is the negation of the live test",
    ).toBe(0);

    // "this contact started" must admit the fast tap. The library writes it
    // once, in Q's `local o=`, and it is the onset every entry inherits.
    const started = [
      ...TOUCH_LIBRARY.matchAll(
        new RegExp(F(V, EQ, "4\\s*", OR, "\\s*", V, GT, "8"), "g"),
      ),
    ];
    const bareFour = [
      ...TOUCH_LIBRARY.matchAll(new RegExp(F(V, EQ, "4"), "g")),
    ];
    expect(
      started.length,
      F(
        '"this contact started" is written `',
        V,
        EQ,
        "4 ",
        OR,
        " ",
        V,
        GT,
        "8`, and the library must write it that way where it decides an onset",
      ),
    ).toBe(1);
    // Every `e==4` in the string is either that onset or part of the live test
    // `e~=1 and e~=4`, which is a membership question where excluding 9 is
    // correct. Two sites, and no third.
    expect(
      bareFour.length,
      "an unaccounted `" + F(V, EQ, "4") + "` appeared in the library",
    ).toBe(1);
    expect(
      TOUCH_LIBRARY.includes(
        F(V, "~", "=1 ", AND, " ", V, "~", "=4 ", AND, " ", V, LT, "9"),
      ),
      "the live test lost its shape, so the end path no longer escapes 9",
    ).toBe(true);

    // -----------------------------------------------------------------------
    // THE CLASS-A GATE, and WHICH OF THE TWO ROUTES IT TAKES AND WHY.
    //
    // `decay-idiom.spec.ts` pairs a `glpfs` with the `glt` on the same cell and
    // layer and evaluates `(start + rate * timeout) mod 256`, refusing anything
    // it cannot resolve to a literal. `D`'s starting phase IS THE PARAMETER `w`
    // and its timeout is `w//6`, so that evaluator returns null for both and
    // reads the site as "computed at run time, so never provably 0" - the arm
    // it accepts computed starts through, `derivesTimeout`, is GRIDLOCK's
    // `(256-p)//R` shape and `w//6` is not it.
    //
    // So the pairing is scanned the way that file scans it - the same
    // depth-aware argument split, the same cell-and-layer match - and the
    // ARITHMETIC IS THEN ASSERTED DIRECTLY, over every value `w` can take. That
    // is the route this file takes, and it is stated here rather than left as
    // "by construction".
    // -----------------------------------------------------------------------
    const decay = bodyOf("D");
    const glpfs = callArgs(decay, "glpfs");
    const glt = callArgs(decay, "glt");
    expect(glpfs, "D no longer writes a glpfs").not.toBeNull();
    expect(glt, "D no longer writes a glt").not.toBeNull();
    expect(glpfs!.length, "a glpfs takes five arguments").toBe(5);
    expect(glt!.length, "a glt takes three arguments").toBe(3);
    // Same cell, same layer - the pairing rule, not a coincidence of order.
    expect(glt![0], "the glt schedules a different cell from the glpfs").toBe(
      glpfs![0],
    );
    expect(glt![1], "the glt schedules a different layer from the glpfs").toBe(
      glpfs![1],
    );
    // A shaped write is a keeper, not a decay; a rate of 0 does not walk.
    expect(glpfs![4], "D writes a shaped oscillation, not a decay").toBe("0");
    expect(glpfs![3], "D's rate moved off the byte ring's -6").toBe("250");
    expect(glpfs![2], "D's starting phase is not its own argument").toBe("w");
    expect(glt![2], "D's timeout is not derived from its starting phase").toBe(
      "w//6",
    );

    // The arithmetic, over every legal w. `w` is a BYTE, so the largest
    // multiple of six it can hold is 252 and the longest decay D can schedule
    // is 42 ticks. MORPH's @DECAY runs to 126 and keeps the inline idiom.
    const rate = Number(glpfs![3]);
    const stranded: string[] = [];
    let longest = 0;
    for (let w = 6; w <= 255; w += 6) {
      const timeout = Math.floor(w / 6);
      const frozen = (((w + rate * timeout) % 256) + 256) % 256;
      if (frozen !== 0) stranded.push(`w=${w} freezes at ${frozen}`);
      longest = Math.max(longest, timeout);
    }
    expect(
      stranded.join("; "),
      "A DECAYING LAYER MUST LAND ON PHASE 0. D strands a layer above 0, " +
        "which stays lit forever with no Timer coming back to clear it",
    ).toBe("");
    expect(longest, "D's ceiling is 42 ticks, at w = 252").toBe(42);
    // And the value that is NOT a multiple of six is stranded, so the rule
    // above is a rule and not a tautology.
    expect(
      (((7 + rate * Math.floor(7 / 6)) % 256) + 256) % 256,
      "a w that is not a multiple of six lands on 0 anyway, so the multiple " +
        "rule is meaningless and this gate proves nothing",
    ).not.toBe(0);
  });
});
