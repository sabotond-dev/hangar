// The touch library's six gates: what each slot costs, what the library is called, what it is
// allowed to say, which side of the split each thing lives on, that the knots on the wire are
// the measured ones, and that K lands on 0, N sits with the map and G kept its picture.
//
// A SERVER SPEC, BY CHOICE: this file measures TWO strings once each, so it runs per run in
// `server` rather than per wave in the sweep, and `npm run test:sweep` stays at `4 19`.
//
// SIX TESTS, AND THE COUNT DOES NOT MOVE WITH THE LIBRARY. Each loops over the parts or the call
// sites internally and names what it found, so a fourteenth function - which must arrive with
// its caller named, see `library.ts` section 5 - moves no number here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
import { PadSim, screenToHw } from "../../vendor/botor/pad-sim";
import { padReady } from "../pad";
import {
  createLuaHost,
  HOST_GLOBALS,
  HOST_SELF_METHODS,
} from "../sim/lua-host";
import { blankPadState } from "../sim/lua-pad-sim";
import { calibratedAxis, KX, KY, LED_STEP, renderKnots } from "./calibration";
import {
  LIBRARY_CONVENTIONS,
  LIBRARY_GLOBALS,
  LIBRARY_PARTS,
  LIBRARY_VERSION,
  TOUCH_LIBRARY,
  TOUCH_LIBRARY_TIMER,
  type LibrarySlot,
} from "./library";

/**
 * The figures this file replaces, kept so a green run still prints the
 * arithmetic rather than only its result: 12-07's one-slot library, and the
 * 255/6 with a `G` that relied on a pre-coloured layer - the figure the user
 * was shown when the second slot was put to them (12.1-CONTEXT D-03), before
 * D-11 put the colour in `G`.
 */
const ONE_SLOT_12_07 = 769;
const PRE_COLOURED_TIMER = 683;

/** Assembled at run time, never written out - `touch-guard.spec.ts`'s rule. */
const F = (...parts: string[]): string => parts.join("");

const V = "e";
const EQ = F("=", "=");
const GE = F(">", "=");
const GT = ">";
const LT = "<";
const AND = F("an", "d");
const OR = F("o", "r");

/** The two strings by slot, in the order the module is written. */
const SLOTS: readonly { readonly slot: LibrarySlot; readonly lua: string }[] = [
  { slot: 6, lua: TOUCH_LIBRARY_TIMER },
  { slot: 0, lua: TOUCH_LIBRARY },
];

/** The two knot names - the only names longer than one capital. */
const TWO_CAPITALS: readonly string[] = ["KX", "KY"];

/**
 * Every firmware Lua global, from the six files `12-RESEARCH.md` §3b checked.
 *
 * CITED, NOT READ. The sibling repository is not on this machine's test path
 * and a spec that reached across it would be green here and red anywhere else,
 * so the list is transcribed once with its provenance:
 * `../grid-fw/common/src/lua/{init,events,mapsat,simplecolor,simplemidi,autovalue}.lua`,
 * read on 2026-09-10, and grepped again on 2026-09-11 (plan 12.1-02) for
 * `KX`, `KY`, `function U`, `function G`, `function V`, `function N` - zero
 * matches. The point of the list is its SHAPE, and the shape is the whole
 * licence for capital names: the shortest firmware global is `EFN` at three
 * characters (`grid_ui.c:370-383` sets it around every event body), and not
 * one of them is one or two capitals.
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

/** The body of one named library part, braces and all. */
function bodyOf(name: string): string {
  const part = LIBRARY_PARTS.find((p) => p.name === name);
  if (!part) throw new Error(`the library has no part named ${name}`);
  return part.lua;
}

/** The parts of one slot, in order. */
function partsOf(slot: LibrarySlot): string[] {
  return LIBRARY_PARTS.filter((p) => p.slot === slot).map((p) => p.lua);
}

/** How many times `needle` occurs in `text`. */
function count(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

/**
 * Where a name is DEFINED: `function NAME(` in any part, or `NAME=` in a
 * header part. `L=l` inside `G` and `B[i]=n` are assignments to state the
 * header created, not definitions, and this is what keeps them apart.
 */
function definitionSlots(name: string): LibrarySlot[] {
  const out: LibrarySlot[] = [];
  for (const part of LIBRARY_PARTS) {
    const isHeader =
      part.name === "header and tables" || part.name === "the map";
    const re = isHeader
      ? new RegExp(`\\b${name}=`, "g")
      : new RegExp(`\\bfunction\\s+${name}\\s*\\(`, "g");
    for (let n = [...part.lua.matchAll(re)].length; n > 0; n -= 1) {
      out.push(part.slot);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------

describe("the touch library (CONT-02, PREV-01)", () => {
  beforeAll(async () => {
    // compressScript THROWS before the WASM formatter resolves and checkSyntax
    // silently returns false, so a gate that skipped this would report a
    // correct library as broken. Same first line as every other measuring spec.
    await padReady();
  });

  it("1. costs what it says on both slots, and each is its own fixed point", () => {
    const costs: Record<LibrarySlot, number> = { 0: 0, 6: 0 };
    for (const { slot, lua } of SLOTS) {
      const raw = partsOf(slot);
      const uniform = raw.join(" ");
      const partSum = raw.reduce((n, p) => n + p.length, 0);

      // THE PARTS ARITHMETIC, ASSERTED RATHER THAN COPIED. N segments joined
      // with N-1 single spaces is the raw source length; if the parts do not
      // sum to it, one of them is mistyped.
      expect(
        partSum + raw.length - 1,
        `255/${slot}: the parts do not sum to the raw source`,
      ).toBe(uniform.length);

      // CANONICAL, AND THE ONE EDIT THE MINIFIER MAKES IS NAMED. On each slot
      // the uniform join is exactly one character longer than the shipped
      // string: the space before `function U` (after the map's `}`) on 255/0,
      // the space before `function V` (after the marker's `]]`) on 255/6.
      // Asserting compressScript(uniform) === shipped is what makes the join
      // a measurement rather than a claim.
      expect(
        GridScript.compressScript(uniform),
        `255/${slot}: the uniform join no longer compresses to the shipped ` +
          "string, so the canonical form moved and the shipped join has to " +
          "be re-derived",
      ).toBe(lua);
      expect(
        uniform.length - lua.length,
        `255/${slot}: the minifier drops exactly one separator from the ` +
          "uniform join",
      ).toBe(1);
      expect(
        GridScript.compressScript(lua),
        `255/${slot}: the shipped string is not a fixed point of the ` +
          "minifier, so cost() would charge the raw length and the budget " +
          "meter would be lying",
      ).toBe(lua);

      const cost = Math.max(lua.length, GridScript.compressScript(lua).length);
      costs[slot] = cost;
      console.log(
        `255/${slot} costs ${cost} of ${EVENT_BUDGET}, ` +
          `${EVENT_BUDGET - cost} free - against ${uniform.length} raw. ` +
          "Parts: " +
          LIBRARY_PARTS.filter((p) => p.slot === slot)
            .map((p) => `${p.name} ${p.lua.length}`)
            .join(", "),
      );
      expect(
        cost,
        `255/${slot}: ${cost} characters, ${EVENT_BUDGET - cost} free`,
      ).toBeLessThanOrEqual(EVENT_BUDGET);

      // THE VERSION IS NOT IN THE LUA, and the way to assert that is to assert
      // each string carries no comment at all beyond the event marker: a
      // version stamp would have to be one, and a comment costs real
      // characters out of 908 because the minifier does not strip them.
      expect(
        count(lua, "--"),
        `255/${slot}: the string carries a comment beyond its event marker; ` +
          "the minifier does not strip comments, so it is paying for it",
      ).toBe(1);
      expect(
        lua.indexOf("--"),
        `255/${slot}: the event marker is not the head of the string`,
      ).toBe(0);
    }

    // The figures beside the record, so a green run prints them together:
    // 255/0 is longer than 12-07's one-slot library (the map and `U` joined
    // it, `A` and `D` left) and 255/6 is longer than the pre-coloured shape
    // by exactly what `glc(a,l,r,g,b,1)` and the three colour parameters cost.
    console.log(
      `the library: 255/0 ${costs[0]} + 255/6 ${costs[6]} = ` +
        `${costs[0] + costs[6]}; 12-07's one slot read ${ONE_SLOT_12_07}, ` +
        `the pre-coloured 255/6 read ${PRE_COLOURED_TIMER}`,
    );
    expect(
      costs[6],
      "the colour in G (D-11) costs more than the pre-coloured shape, by " +
        "construction; a 255/6 no longer than 683 has lost the glc",
    ).toBeGreaterThan(PRE_COLOURED_TIMER);
    expect(
      LIBRARY_VERSION,
      "the library version is a TypeScript constant",
    ).toBe("1");
  });

  it("2. names every global with one capital except KX and KY, defines each in exactly one slot, and collides with nothing", () => {
    // NO `local function`, IN EITHER STRING. Firmware wraps each stored event
    // body in its own function (`grid_ui.c:370-383`), so a local defined in
    // the system Setup or Timer is invisible to every touch Setup that would
    // call it - the library would load clean and then raise "attempt to call a
    // nil value" on the first finger.
    for (const { slot, lua } of SLOTS) {
      expect(
        lua.includes(F("local", " ", "function")),
        `255/${slot} declares a local function, which no touch Setup can see`,
      ).toBe(false);
    }

    // Every definition is a single capital, and the scan is over the strings.
    const defined = SLOTS.flatMap(({ lua }) =>
      [...lua.matchAll(/\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)/g)].map(
        (m) => m[1],
      ),
    );
    expect(defined.length, "the scan found thirteen function definitions").toBe(
      13,
    );
    for (const name of defined) {
      expect(
        /^[A-Z]$/.test(name),
        `${name} is not a single capital, and every call site pays its length`,
      ).toBe(true);
    }

    // The derived list is the definitions plus the state names, and it is
    // DERIVED - host-surface.spec.ts admits it without a second copy. EXACTLY
    // TWO NAMES ARE TWO CAPITALS, the knot tables, and they are named here so
    // a third two-letter name is a finding rather than a pattern.
    for (const name of defined) {
      expect(LIBRARY_GLOBALS, `${name} is defined but not derived`).toContain(
        name,
      );
    }
    const twoCapitals: string[] = [];
    for (const name of LIBRARY_GLOBALS) {
      if (/^[A-Z]$/.test(name)) continue;
      expect(
        /^[A-Z]{2}$/.test(name),
        `${name} is neither one capital nor two`,
      ).toBe(true);
      twoCapitals.push(name);
    }
    expect(
      twoCapitals.sort(),
      "the two-capital names are exactly the two knot tables",
    ).toEqual([...TWO_CAPITALS].sort());
    expect(
      LIBRARY_GLOBALS.length,
      "thirteen functions and eight state names across the two strings",
    ).toBe(21);

    // EVERY NAME IS DEFINED IN EXACTLY ONE SLOT. A name defined in both would
    // be one string overwriting the other's on every page load; a name defined
    // in neither would be in the derived list by a regex accident.
    const bySlot: Record<LibrarySlot, string[]> = { 0: [], 6: [] };
    for (const name of LIBRARY_GLOBALS) {
      const slots = definitionSlots(name);
      expect(
        slots,
        `${name} is in LIBRARY_GLOBALS and is defined in ${slots.length} ` +
          "places rather than one",
      ).toHaveLength(1);
      bySlot[slots[0]].push(name);
    }
    console.log(
      `255/0 defines ${bySlot[0].join(" ")}; 255/6 defines ${bySlot[6].join(" ")}`,
    );
    expect(bySlot[0].length + bySlot[6].length).toBe(LIBRARY_GLOBALS.length);
    expect(
      bySlot[6].every((name) => /^[A-Z]$/.test(name)),
      "the map and its two-letter names live in 255/0 only",
    ).toBe(true);

    // EVERY CAPITAL CALL SITE IN EITHER STRING IS ACCOUNTED FOR. The library
    // calls one name it does not define - `R`, the entry's release convention -
    // and this is where an eleventh function or a second convention would
    // have to declare itself instead of arriving unannounced.
    const called = [
      ...new Set(
        SLOTS.flatMap(({ lua }) =>
          [...lua.matchAll(/(^|[^A-Za-z0-9_.:])([A-Z]{1,2})\(/g)].map(
            (m) => m[2],
          ),
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
    // And the shape that licenses one- and two-capital names in the first
    // place.
    for (const name of FIRMWARE_GLOBALS) {
      expect(
        name.length,
        `${name} is a one- or two-capital firmware global, so the library's ` +
          "naming rule has lost its licence",
      ).toBeGreaterThan(2);
    }
  });

  it("3. passes the pinned syntax check and both class gates, on both strings", () => {
    for (const { slot, lua } of SLOTS) {
      expect(
        GridScript.checkSyntax(lua),
        `255/${slot}: the pinned checker refuses the string`,
      ).toBe(true);
    }

    // -----------------------------------------------------------------------
    // THE CLASS-B GATE, over the strings rather than over the catalog.
    // `touch-guard.spec.ts` scans hand-authored ENTRIES; the library is not one,
    // so its own Lua would go unchecked by the file whose rule it has to obey.
    // The needles are assembled from fragments, exactly as that file assembles
    // its own. Both strings are scanned as one text: `Q` in 255/0 carries the
    // live test, and `G` in 255/6 its deliberate variant without `and e<9`
    // (below).
    // -----------------------------------------------------------------------
    const both = SLOTS.map(({ lua }) => lua).join("\n");

    // "this contact ended" is `e>=5 and e<9`. The library does not write one:
    // its end test is the negation of the live test, `e~=1 and e~=4 and e<9`,
    // which names 9 by admitting everything at or above it and is self-guarding.
    // Asserting ZERO sites is the honest reading, and it fails the moment an
    // unescaped one is added.
    const ended = [
      ...both.matchAll(
        new RegExp(F(V, "\\s*(", GE, "|", GT, ")\\s*([0-9]+)"), "g"),
      ),
    ].filter((m) => (m[1] === GE ? m[2] === "5" : m[2] === "4"));
    for (const site of ended) {
      const after = both.slice(site.index + site[0].length);
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
      ...both.matchAll(
        new RegExp(F(V, EQ, "4\\s*", OR, "\\s*", V, GT, "8"), "g"),
      ),
    ];
    const bareFour = [...both.matchAll(new RegExp(F(V, EQ, "4"), "g"))];
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
    // Every `e==4` in the strings is that one onset; the live test is written
    // `e~=1 and e~=4 and e<9` and it appears ONCE, in `Q`: a 9 carries a
    // press, so `Q` must return its cell for the toggle.
    expect(
      bareFour.length,
      "an unaccounted `" + F(V, EQ, "4") + "` appeared in the library",
    ).toBe(1);
    const notMoveOrDown = F(V, "~", "=1 ", AND, " ", V, "~", "=4");
    const live = F(notMoveOrDown, " ", AND, " ", V, LT, "9");
    expect(
      count(bodyOf("Q"), live),
      "Q's live test lost its shape, so the end path no longer escapes 9",
    ).toBe(1);
    // `G` DELIBERATELY DOES NOT WRITE THE LIVE TEST (12.1-03, from the residue
    // gate in lua-smoke.spec.ts). Its question is not "does this contact
    // contribute a cell" but "is there a finger to draw", and a 9 is a press
    // AND a lift in one message: drawing it would leave the finger's block
    // lit with nobody touching the pad until the Timer's sweep expired the
    // contact - measured at phase 134 on EUCLID's cell 20, 200 ticks after a
    // synthesised fast tap. So `G`'s end test is `e~=1 and e~=4` with NO
    // `and e<9`: a 9 clears the contact's previous block and draws nothing.
    // The two functions are meant to disagree about a 9, and this asserts it.
    expect(
      count(bodyOf("G"), F(notMoveOrDown, " then B[i]=nil return end")),
      "G's end test must be `e~=1 and e~=4` with no `and e<9`: a coalesced " +
        "press-and-lift has no finger left to draw",
    ).toBe(1);
    expect(
      count(bodyOf("G"), live),
      "G took the live test back, so a fast tap leaves its block lit until " +
        "the sweep",
    ).toBe(0);
    expect(count(both, live), "the live test appears exactly once").toBe(1);

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
    // "by construction". `D` moved to 255/6 unchanged; the gate moved with it.
    // -----------------------------------------------------------------------
    const decay = bodyOf("D");
    expect(TOUCH_LIBRARY_TIMER.includes(decay), "D is no longer in 255/6").toBe(
      true,
    );
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

  it("4. keeps state and the map in 255/0 and every LED write and send in 255/6, joined by exactly one self:tim()", () => {
    // THE SPLIT RULE (`library.ts` section 2): 255/0 holds state and the map,
    // 255/6 the painters and the senders. A change to the finger's look never
    // touches the string that holds the knots, and the string that holds the
    // knots never writes an LED or sends a message. Each half is asserted from
    // both sides - absent here, present there - so an empty string could not
    // pass either.
    for (const name of ["glp(", "glc(", "gms("]) {
      expect(
        count(TOUCH_LIBRARY, name),
        `255/0 writes an LED or sends a message (${name}); that belongs in 255/6`,
      ).toBe(0);
      expect(
        count(TOUCH_LIBRARY_TIMER, name),
        `255/6 no longer carries ${name}, so a painter or a sender left it`,
      ).toBeGreaterThan(0);
    }
    for (const name of ["KX=", "KY="]) {
      expect(count(TOUCH_LIBRARY, name), `${name} is missing from 255/0`).toBe(
        1,
      );
      expect(
        count(TOUCH_LIBRARY_TIMER, name),
        `${name} appears in 255/6, so the map is defined twice`,
      ).toBe(0);
    }

    // THE JOIN IS ONE CALL, EXACTLY ONCE, AND ONLY IN 255/0. Twice would run
    // the Timer body twice on every page load; in 255/6 it would recurse.
    expect(
      count(TOUCH_LIBRARY, "self:tim()"),
      "255/0 must call self:tim() exactly once - it is what defines the " +
        "255/6 half on a page load",
    ).toBe(1);
    expect(
      count(TOUCH_LIBRARY_TIMER, "self:tim()"),
      "255/6 calls self:tim(), which is itself",
    ).toBe(0);
    expect(
      TOUCH_LIBRARY.endsWith("self:tim()"),
      "the call is the last thing in 255/0, after every definition it needs",
    ).toBe(true);

    // The parts' slots agree with the strings they are built into.
    for (const part of LIBRARY_PARTS) {
      const home = part.slot === 0 ? TOUCH_LIBRARY : TOUCH_LIBRARY_TIMER;
      expect(
        home.includes(part.lua),
        `${part.name} is declared for 255/${part.slot} and is not in that string`,
      ).toBe(true);
    }
    expect(
      LIBRARY_PARTS.filter((p) => p.slot === 0).length,
      "255/0 has nine parts: header, map, six functions, the call",
    ).toBe(9);
    expect(
      LIBRARY_PARTS.filter((p) => p.slot === 6).length,
      "255/6 has eight parts: marker and seven functions",
    ).toBe(8);
  });

  it("5. puts calibration.ts's knots on the wire verbatim, once", () => {
    // THE MAP IS RENDERED, NOT TYPED. `renderKnots()` is the one literal a
    // test may hold (calibration.spec.ts test 2), because it is what goes on
    // the wire; here it is asserted to be IN the wire string exactly once, and
    // to be the library's own map part, so a knot edited in the table moves in
    // 255/0 by derivation and a knot edited by hand in the string is caught.
    const knots = renderKnots();
    expect(
      count(TOUCH_LIBRARY, knots),
      "the rendered knots are in 255/0 once",
    ).toBe(1);
    expect(bodyOf("the map"), "the map part is renderKnots()").toBe(knots);
    expect(
      count(TOUCH_LIBRARY_TIMER, "KX={"),
      "255/6 carries a knot table",
    ).toBe(0);

    // And the literal parses back to the two arrays, so what the Lua will
    // index as `k[1]..k[9]` is what calibration.ts holds as `K[0]..K[8]`.
    const m = /^KX=\{([0-9,]+)\}KY=\{([0-9,]+)\}$/.exec(knots);
    expect(
      m,
      "the rendered knots have the shape KX={...}KY={...}",
    ).not.toBeNull();
    expect(m![1].split(",").map(Number)).toEqual([...KX]);
    expect(m![2].split(",").map(Number)).toEqual([...KY]);
    expect(knots.includes(" "), "the map carries a space on the wire").toBe(
      false,
    );

    // `U` reads exactly nine knots: `k[1]` and `k[9]` are its clamp and
    // `i=1,8` its walk. A table of another length would clamp to nil.
    const u = bodyOf("U");
    expect(
      u.includes("k[1],k[9]"),
      "U clamps to the first and ninth knot",
    ).toBe(true);
    expect(u.includes("for i=1,8 do"), "U walks eight segments").toBe(true);
    expect(KX.length, "nine knots in x").toBe(9);
    expect(KY.length, "nine knots in y").toBe(9);
  });

  it("6. lands every K stamp on phase 0 from a start that is a multiple of 6, keeps N in the map's slot, and draws through Z and Y exactly what 12.1-03's G drew", async () => {
    // PLAN 12.1-08b (12.1-CONTEXT D-26 item 2, D-27). Three claims about the
    // revision that gave the eight preset cards the gradient, each driven
    // through the real host over both library strings rather than read off
    // the text.

    // 1. THE SLOTS. `N` is the map - no LED write, no send - and 255/6 could
    //    not hold `K` beside it (934, 26 over), so it lives in 255/0 now;
    //    `Z`, `Y` and `K` are painters and live in 255/6. Test 2 asserts each
    //    name is defined exactly once; this is WHERE.
    expect(definitionSlots("N"), "N is defined in the map's slot").toEqual([0]);
    for (const name of ["Z", "Y", "K"]) {
      expect(definitionSlots(name), `${name} is defined in 255/6`).toEqual([6]);
    }
    expect(bodyOf("N"), "N's text did not move with its slot").toBe(
      "function N(x,y)return(U(x,KX)+32)//64+(U(y,KY)+32)//64*9 end",
    );

    // 2. THE STAMP. `K(x,y,l,w)` starts each of the block's four cells at
    //    `w*weight//4096` quantised DOWN to a multiple of 6 and hands it to
    //    `D` (rate 250), so every cell walks to exactly 0 - both Phase 11
    //    gates. Driven at the 81 LED centres, the eight midpoints along row 4
    //    and the eight along column 4, the centre of four and the four raw
    //    corners; after each stamp one tick is run and the layer read back,
    //    then sixty ticks drain it and every layer-1 cell must read 0.
    //
    //    After exactly one tick a stamped cell reads pha = start - 6 (mod 256)
    //    and timeout = start/6 - 1 with fre still 250, so the start is
    //    (pha + 6) & 255 - except a start of 6, whose one tick lands it on 0
    //    with fre zeroed, indistinguishable from an untouched cell and
    //    asserted as such.
    const hwOf = (cell: number): number =>
      screenToHw(cell % 9, Math.floor(cell / 9));
    const W = 252;
    const expectedStamp = (x: number, y: number): Record<number, number> => {
      const u = calibratedAxis(x, "x");
      const v = calibratedAxis(y, "y");
      const c = Math.min(Math.floor(u / LED_STEP), 7);
      const q = Math.min(Math.floor(v / LED_STEP), 7);
      const f = u - c * LED_STEP;
      const h = v - q * LED_STEP;
      const out: Record<number, number> = {};
      for (let d = 0; d < 4; d += 1) {
        const weight =
          (d % 2 > 0 ? f : LED_STEP - f) *
          (Math.floor(d / 2) > 0 ? h : LED_STEP - h);
        const z = Math.floor(Math.floor((W * weight) / 4096) / 6) * 6;
        if (z > 0) out[c + q * 9 + (d % 2) + Math.floor(d / 2) * 9] = z;
      }
      return out;
    };
    const points: { x: number; y: number; label: string }[] = [];
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        points.push({ x: KX[c], y: KY[r], label: `LED (${c},${r})` });
      }
    }
    for (let c = 0; c < 8; c += 1) {
      points.push({
        x: Math.floor((KX[c] + KX[c + 1]) / 2),
        y: KY[4],
        label: `midway between LED ${c} and ${c + 1} in x, row 4`,
      });
    }
    for (let r = 0; r < 8; r += 1) {
      points.push({
        x: KX[4],
        y: Math.floor((KY[r] + KY[r + 1]) / 2),
        label: `midway between LED ${r} and ${r + 1} in y, column 4`,
      });
    }
    points.push({
      x: Math.floor((KX[4] + KX[5]) / 2),
      y: Math.floor((KY[4] + KY[5]) / 2),
      label: "the centre of four",
    });
    for (const [x, y] of [
      [0, 0],
      [127, 0],
      [0, 127],
      [127, 127],
    ]) {
      points.push({ x, y, label: `raw corner (${x},${y})` });
    }

    const stampSim = new PadSim(blankPadState());
    const stampHost = await createLuaHost({
      sim: stampSim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup: "--[[@cb]]self.touch_cb=function(s,i,e,x,y)K(x,y,1,252)end",
    });
    let stamps = 0;
    let multiCell = 0;
    const report: string[] = [];
    try {
      expect(stampHost.errors, "the library raised on load").toEqual([]);
      for (const point of points) {
        stampHost.touchDown(0, point.x, point.y);
        stampHost.run(1);
        const expected = expectedStamp(point.x, point.y);
        const observed: Record<number, number> = {};
        for (let cell = 0; cell < 81; cell += 1) {
          const layer = stampSim.layer(hwOf(cell), 1);
          if (layer.fre === 0 && layer.timeout === 0) {
            expect(
              layer.pha,
              `${point.label}: cell ${cell} is frozen above 0 on layer 1`,
            ).toBe(0);
            continue;
          }
          const start = (layer.pha + 6) & 255;
          expect(
            start % 6,
            `${point.label}: cell ${cell} started at ${start}, not a multiple of 6`,
          ).toBe(0);
          expect(
            layer.timeout + 1,
            `${point.label}: cell ${cell}'s timeout is not start/6`,
          ).toBe(start / 6);
          expect(
            (layer.pha + layer.fre * layer.timeout) & 255,
            `${point.label}: cell ${cell} will freeze above 0`,
          ).toBe(0);
          observed[cell] = start;
          stamps += 1;
        }
        // The TS twin, minus the starts of 6 that one tick already retired.
        const visible = Object.fromEntries(
          Object.entries(expected).filter(([, z]) => z !== 6),
        );
        expect(
          observed,
          `${point.label}: the stamped cells and starts are not the twin's`,
        ).toEqual(visible);
        for (const [cell, z] of Object.entries(expected)) {
          if (z !== 6) continue;
          const layer = stampSim.layer(hwOf(Number(cell)), 1);
          expect(
            [layer.pha, layer.fre, layer.timeout],
            `${point.label}: a start of 6 at cell ${cell} did not land on 0 in one tick`,
          ).toEqual([0, 0, 0]);
        }
        if (Object.keys(expected).length > 1) multiCell += 1;
        report.push(
          `  ${point.label.padEnd(44)} ${
            Object.entries(expected)
              .map(([cell, z]) => `${cell}=${z}/t${z / 6}`)
              .join(" ") || "(nothing)"
          }`,
        );
        // The drain: every stamp lands on 0, observed rather than derived.
        stampHost.run(60);
        for (let cell = 0; cell < 81; cell += 1) {
          const layer = stampSim.layer(hwOf(cell), 1);
          expect(
            [layer.pha, layer.fre, layer.timeout],
            `${point.label}: cell ${cell} did not land on 0 after the decay`,
          ).toEqual([0, 0, 0]);
        }
      }
      expect(stampHost.errors, stampHost.errors.join(" | ")).toEqual([]);
    } finally {
      stampHost.close();
    }
    expect(
      stamps,
      "K stamped nothing, so nothing above was checked",
    ).toBeGreaterThan(points.length);
    expect(
      multiCell,
      "no point stamped more than one cell - the weights are not being read",
    ).toBeGreaterThan(16);
    // The bench case (12.1-CONTEXT D-02): a finger on LED (7,1), which the
    // naive divisor read as cell 8, stamps cell 16 alone at the full start.
    expect(expectedStamp(KX[7], KY[1]), "LED (7,1) is cell 16 to K").toEqual({
      16: W,
    });

    // 3. THE IDENTITY. `G` goes through `Z` and `Y` since this revision and
    //    its output must not have moved: the 12.1-03 text is held here as a
    //    literal - the ONE literal copy of a library function outside
    //    library.ts, for this comparison only - and both forms are driven over
    //    the raw plane every 7 units on both axes, layer 0 compared cell by
    //    cell after every sample (phase and colour), 361 points.
    const G_12_1_03 =
      "function G(s,i,e,x,y,l,r,g,b)L=l local o=B[i]if o then V(o)end " +
      "if e~=1 and e~=4 then B[i]=nil return end " +
      "local u,w=U(x,KX),U(y,KY)local c,q=glim(u//64,0,7),glim(w//64,0,7)" +
      "local f,h=u-c*64,w-q*64 local n=c+q*9 for d=0,3 do local p,t=d%2,d//2 " +
      "local a=glag(0,n+p+t*9)glc(a,l,r,g,b,1)" +
      "glp(a,l,255*(p>0 and f or 64-f)*(t>0 and h or 64-h)//4096)end B[i]=n end";
    expect(G_12_1_03.length, "the 12.1-03 G measured 352").toBe(352);
    expect(
      bodyOf("G"),
      "G is the 12.1-03 text, so this compares nothing",
    ).not.toBe(G_12_1_03);
    expect(bodyOf("G").length, "G through Z and Y measures 221").toBe(221);
    expect(count(TOUCH_LIBRARY_TIMER, bodyOf("G")), "G is in 255/6 once").toBe(
      1,
    );
    const pristineTimer = TOUCH_LIBRARY_TIMER.replace(bodyOf("G"), G_12_1_03);
    const fingerSetup =
      "--[[@cb]]self.touch_cb=function(s,i,e,x,y)G(s,i,e,x,y,0,255,187,0)end";
    const revised = new PadSim(blankPadState());
    const pristine = new PadSim(blankPadState());
    const revisedHost = await createLuaHost({
      sim: revised,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup: fingerSetup,
    });
    const pristineHost = await createLuaHost({
      sim: pristine,
      system: TOUCH_LIBRARY,
      systemTimer: pristineTimer,
      setup: fingerSetup,
    });
    let compared = 0;
    let litSamples = 0;
    try {
      let first = true;
      for (let x = 0; x <= 127; x += 7) {
        for (let y = 0; y <= 127; y += 7) {
          for (const host of [revisedHost, pristineHost]) {
            if (first) host.touchDown(0, x, y);
            else host.touchMove(0, x, y);
            host.run(1);
          }
          first = false;
          let lit = 0;
          for (let cell = 0; cell < 81; cell += 1) {
            const a = revised.layer(hwOf(cell), 0);
            const b = pristine.layer(hwOf(cell), 0);
            expect(
              [a.pha, ...a.max],
              `G through Z and Y differs from 12.1-03's G at (${x},${y}), cell ${cell}`,
            ).toEqual([b.pha, ...b.max]);
            if (a.pha !== 0) lit += 1;
            compared += 1;
          }
          if (lit > 0) litSamples += 1;
        }
      }
      for (const host of [revisedHost, pristineHost]) {
        host.touchUp(0, 127, 127);
        host.run(1);
      }
      for (let cell = 0; cell < 81; cell += 1) {
        expect(revised.layer(hwOf(cell), 0).pha, "dark after the lift").toBe(0);
        expect(pristine.layer(hwOf(cell), 0).pha, "dark after the lift").toBe(
          0,
        );
      }
      expect(revisedHost.errors, revisedHost.errors.join(" | ")).toEqual([]);
      expect(pristineHost.errors, pristineHost.errors.join(" | ")).toEqual([]);
    } finally {
      revisedHost.close();
      pristineHost.close();
    }
    expect(compared, "361 points x 81 cells").toBe(19 * 19 * 81);
    expect(
      litSamples,
      "no sample lit anything, so the identity compared two dark pads",
    ).toBe(19 * 19);

    console.log(
      "K on the measured knots (start/timeout per cell, from the TS twin, " +
        `${stamps} stamps observed across ${points.length} points):\n` +
        report.join("\n") +
        `\nG through Z and Y against 12.1-03's G: ${compared} records equal ` +
        `over ${19 * 19} samples`,
    );
  }, 60000);
});
