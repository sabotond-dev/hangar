// The D-07 gate: no hand-authored configuration may call a name the HANGAR Lua
// host does not register.
//
// WHY THIS FILE EXISTS, AND WHY IT IS NOT A BLOCKLIST. HANGAR's browser host
// registers fifteen bare Grid names and nine `self:` methods, and that is the
// whole surface (`src/lib/sim/lua-host.ts`, HOST_GLOBALS / HOST_SELF_METHODS).
// The vendored compiler's own scanner knows a WIDER surface - `findTraps`
// guards ten LED calls including `gln`, `gld` and `glx` (`_pad.ts:3513-3524`),
// none of which the host binds. So recipe-book Lua passes the static gate
// cleanly and then raises "attempt to call a nil value" at run time, and only
// if a scripted gesture happens to reach the line. Test 3 below proves that
// disagreement from both sides rather than describing it.
//
// A blocklist naming those three would close today's gap and miss tomorrow's.
// The classifier here is the other shape: it RESOLVES every call site against
// the registered surface and refuses everything it cannot account for, so a
// name nobody has thought of yet is refused by construction.
//
// FOUR TESTS, AND THE COUNT NEVER MOVES. Every one loops over the entries
// internally and names the entry, the event, the call and its index, so a wave
// that adds configurations moves no number here.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEFAULT_PAD_STATE, findTraps } from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import {
  createLuaHost,
  HOST_GLOBALS,
  HOST_SELF_METHODS,
  type LuaHost,
} from "../sim/lua-host";
import { renderLua } from "../sim/lua-pad-sim";
import { CATALOG, type CatalogEntry, type LuaKnob } from "./index";

const EVENTS = ["setup", "timer"] as const;
type EventName = (typeof EVENTS)[number];

const GLOBALS: readonly string[] = HOST_GLOBALS;
const SELF_METHODS: readonly string[] = HOST_SELF_METHODS;

/**
 * The numeric library calls whose result is identical across Lua 5.3, 5.4 and
 * 5.5. Deliberately the same list `lua-entries.sweep.spec.ts` allows, for the
 * same reason: a call outside it may differ between the VM in the browser and
 * the VM in the firmware.
 */
const ALLOWED_MATH: readonly string[] = [
  "atan",
  "sqrt",
  "abs",
  "max",
  "min",
  "floor",
  "tointeger",
];

/**
 * The Lua base library a configuration may reach for, and nothing else. Each
 * member carries a reason, and the list is short on purpose.
 *
 * `print` is NOT here. Firmware's print costs the 256-byte protocol buffer and
 * the host does not register it at all, so a configuration that reached for it
 * would raise in the browser and cost real bytes on the module.
 */
const LUA_BASE: readonly string[] = [
  "type", // branching on nil versus number, which every touch handler does
  "tostring", // building a message for an error() a gate will read
  "tonumber", // parsing a knob value that arrived as text
  "ipairs", // walking an array part in order
  "pairs", // walking a per-contact table - SONAR and LATTICE both do
  "select", // reading a variadic argument count without a table
];

/**
 * Lua's reserved words. A reserved word immediately followed by `(` is never a
 * call - it is a function definition (`function(s,i,e,x,y)`), a parenthesised
 * expression (`return(x)`, `not(y)`) or a syntax error. Filtering them out is
 * what stops `self.touch_cb=function(...)` reading as a call to something named
 * `function`.
 */
const LUA_KEYWORDS = new Set([
  "and",
  "break",
  "do",
  "else",
  "elseif",
  "end",
  "false",
  "for",
  "function",
  "goto",
  "if",
  "in",
  "local",
  "nil",
  "not",
  "or",
  "repeat",
  "return",
  "then",
  "true",
  "until",
  "while",
]);

const NAME_CHAR = /[A-Za-z0-9_]/;

/** One call site, with the character before it - the whole discrimination. */
type CallSite = {
  readonly name: string;
  /** ":" a method call, "." a field call, anything else a bare call. */
  readonly prefix: string;
  readonly index: number;
};

type Resolved = CallSite & {
  readonly ok: boolean;
  /** Why it resolved, or why it could not. Read straight into the message. */
  readonly why: string;
};

/**
 * Every identifier immediately followed by "(", with the character before it.
 *
 * The shape is the vendored scanner's (`_pad.ts:3532-3568`) - scanning
 * continues from the end of the IDENTIFIER rather than the end of the call, so
 * a nested `glp(glag(0,n),1,255)` yields both. The one thing added is the
 * preceding character, which `scanCalls` throws away and which is what tells a
 * `self:gms` from a bare `gms` from a `math.abs`.
 */
function scanCallSites(text: string): CallSite[] {
  const out: CallSite[] = [];
  const re = /[A-Za-z_][A-Za-z0-9_]*(?=\()/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (LUA_KEYWORDS.has(m[0])) continue;
    out.push({
      name: m[0],
      prefix: m.index === 0 ? "" : text[m.index - 1],
      index: m.index,
    });
  }
  return out;
}

/** The identifier immediately before an index, e.g. the `math` of `math.abs`. */
function identifierBefore(text: string, at: number): string {
  let start = at;
  while (start > 0 && NAME_CHAR.test(text[start - 1])) start -= 1;
  return text.slice(start, at);
}

/**
 * Every name in scope as a local, from the same event text.
 *
 * Two patterns, and both are needed. `local a,b` declares two; a parameter list
 * declares more, and a shipped entry writes
 * `self.touch_cb=function(s,i,e,x,y)` and then calls `s:gms(...)` inside it, so
 * a parameter is as real a binding as a `local` is. Anything either pattern
 * names is treated as callable in that text, because from a scanner's position
 * a local holding a function and a local holding a number are the same token.
 */
function localsIn(text: string): Set<string> {
  const out = new Set<string>();

  for (const m of text.matchAll(
    /\blocal\s+function\s+([A-Za-z_][A-Za-z0-9_]*)/g,
  )) {
    out.add(m[1]);
  }
  for (const m of text.matchAll(
    /\blocal\s+([A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*)/g,
  )) {
    for (const name of m[1].split(",")) {
      const trimmed = name.trim();
      if (trimmed !== "" && trimmed !== "function") out.add(trimmed);
    }
  }
  for (const m of text.matchAll(
    /\bfunction\s*[A-Za-z0-9_.:]*\s*\(([^)]*)\)/g,
  )) {
    for (const name of m[1].split(",")) {
      const trimmed = name.trim();
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) out.add(trimmed);
    }
  }

  return out;
}

/**
 * THE CLASSIFIER. Three prefix rules, and nothing outside them resolves.
 *
 *   prefix ":"  -> a method call. Must be in HOST_SELF_METHODS.
 *   prefix "."  -> a field call. Must be math.<one of ALLOWED_MATH>.
 *   otherwise   -> a bare call. Must be in HOST_GLOBALS, or in LUA_BASE, or a
 *                  local declared in the SAME event text.
 *
 * The permitted lists are imported from the host, never restated here: a name
 * added to or removed from registerGlobals moves this gate with no second edit.
 */
function resolveCalls(text: string): Resolved[] {
  const locals = localsIn(text);
  return scanCallSites(text).map((site) => {
    if (site.prefix === ":") {
      const ok = SELF_METHODS.includes(site.name);
      return {
        ...site,
        ok,
        why: ok
          ? "a registered self: method"
          : "a self: method the host's SELF_PRELUDE does not install",
      };
    }
    if (site.prefix === ".") {
      const receiver = identifierBefore(text, site.index - 1);
      const ok = receiver === "math" && ALLOWED_MATH.includes(site.name);
      return {
        ...site,
        ok,
        why: ok
          ? "a version-stable numeric library call"
          : receiver === "math"
            ? "a numeric library call outside the version-stable list"
            : `a field call on "${receiver}", and math is the only table a ` +
              "configuration may reach through",
      };
    }
    if (GLOBALS.includes(site.name)) {
      return { ...site, ok: true, why: "a registered bare global" };
    }
    if (LUA_BASE.includes(site.name)) {
      return { ...site, ok: true, why: "a permitted Lua base call" };
    }
    if (locals.has(site.name)) {
      return { ...site, ok: true, why: "a local declared in this event" };
    }
    return {
      ...site,
      ok: false,
      why:
        "a bare call the HANGAR Lua host does not register, so it raises " +
        '"attempt to call a nil value" the moment this line is reached',
    };
  });
}

/** The hand-authored entries. Empty is a failure, asserted in every test. */
function luaEntries(): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.source.kind === "lua");
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

function cornerIndices(
  entry: CatalogEntry,
  longest: boolean,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const knob of entry.knobs) out[knob.id] = extremeIndex(knob, longest);
  return out;
}

/**
 * The three renderings every entry is scanned at. A knob VALUE can carry a
 * call - a colour knob's cannot, but a mode knob's could - and both corners are
 * free to check once the defaults are being rendered anyway.
 */
function renderingsOf(
  entry: CatalogEntry,
): { label: string; text: Record<EventName, string> }[] {
  return [
    { label: "defaults", text: renderLua(entry) },
    {
      label: "every knob at its longest",
      text: renderLua(entry, cornerIndices(entry, true)),
    },
    {
      label: "every knob at its shortest",
      text: renderLua(entry, cornerIndices(entry, false)),
    },
  ];
}

/** A blank, fully detached sim - the host contributes the VM, nothing else. */
function blank(): PadSim {
  return new PadSim({
    ...DEFAULT_PAD_STATE,
    owned: {
      touchHandler: "user",
      timer: "user",
      layer1: "user",
      layer2: "user",
    },
  });
}

describe("the host surface a hand-authored entry may call (D-07)", () => {
  let host: LuaHost;

  beforeAll(async () => {
    // One VM for the file, over a Setup that does nothing but exist. Test 1
    // reads its real _G; the other three are pure text scanning.
    host = await createLuaHost({ sim: blank(), setup: "--[[@cb]]gtt(0,100)" });
  });

  afterAll(() => {
    host.close();
  });

  it("gates against the registration itself, not a copy of it", () => {
    expect(GLOBALS.length, "HOST_GLOBALS is empty").toBeGreaterThan(0);
    expect(SELF_METHODS.length, "HOST_SELF_METHODS is empty").toBeGreaterThan(
      0,
    );

    // Both directions, from the catalog's side, so this file is honest on its
    // own rather than trusting a spec three directories away. If these arrays
    // ever stopped describing the VM, every assertion below would be gating
    // against fiction.
    const keys = host.globalKeys();
    for (const name of GLOBALS) {
      expect(
        keys,
        `${name} is in HOST_GLOBALS but not in the VM's _G, so this gate ` +
          "permits a call that would raise",
      ).toContain(name);
    }

    const gridShaped = /^(g[a-z]{1,4}|t[xy]m[ai])$/;
    const unlisted = keys.filter(
      (k) => gridShaped.test(k) && !GLOBALS.includes(k),
    );
    expect(
      unlisted,
      "these Grid names are in the VM but not in HOST_GLOBALS, so this gate " +
        "would refuse a call that works: " +
        unlisted.join(", "),
    ).toEqual([]);

    // The self: half. Nothing public on LuaHost evaluates a string, so the
    // classifier is asked instead: every listed method must resolve as a method
    // call, and the same names must NOT resolve bare unless they are also
    // registered bare.
    for (const name of SELF_METHODS) {
      const [call] = resolveCalls(`self:${name}(0)`);
      expect(call.ok, `self:${name}() is listed but does not resolve`).toBe(
        true,
      );
    }
  });

  it("resolves every call site in every hand-authored entry", () => {
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );

    for (const entry of entries) {
      for (const rendering of renderingsOf(entry)) {
        for (const event of EVENTS) {
          const text = rendering.text[event];
          const calls = resolveCalls(text);

          for (const call of calls) {
            expect(
              call.ok,
              `${entry.id}/${event} at ${rendering.label}: "${call.name}" at ` +
                `index ${call.index} is ${call.why}`,
            ).toBe(true);
          }

          // A scan that found nothing proves nothing. An event with text in it
          // calls at least a colour and a phase, so two is a floor no real
          // configuration can sit under; an entry that stores no Timer (MORPH)
          // renders the empty string and is exempted by the same rule.
          if (text !== "") {
            expect(
              calls.length,
              `${entry.id}/${event} at ${rendering.label}: the scan found ` +
                `${calls.length} call sites in ${text.length} characters, ` +
                "which means the scanner stopped seeing this event rather " +
                "than the event being clean",
            ).toBeGreaterThanOrEqual(2);
          }
        }
      }
    }
  });

  it("refuses a call the vendored trap scanner accepts", () => {
    // THE GAP, FROM BOTH SIDES. The compiler's scanner and the browser's host
    // disagree about what the surface IS: `findTraps` guards ten LED calls and
    // `gln` is one of them (`_pad.ts:3513-3524`), so it reads the body below as
    // legitimate and returns nothing to report. HANGAR's Lua host binds no
    // `gln` at all. Every published ZONA recipe is written against the half the
    // host does not have - the three-stop gln/gld/glx idiom - so a
    // configuration transcribed from the recipe book compiles clean and then
    // raises on the pad.
    //
    // "The compiler accepted it" is not "it will render". That sentence is the
    // whole reason this file exists, and this test is the evidence for it
    // rather than a note in a document that could go stale.
    const body = "--[[@cb]]for a=0,80 do gln(a,2,0,0,0)end";

    const hits = findTraps(body);
    expect(
      hits.filter((hit) => hit.text.includes("gln")),
      "the vendored scanner reported gln, so the gap this gate exists for " +
        "has closed upstream and this test should be re-read, not deleted",
    ).toEqual([]);

    const refused = resolveCalls(body).filter((call) => !call.ok);
    expect(
      refused.map((call) => call.name),
      "the classifier accepted gln, which the host cannot execute",
    ).toEqual(["gln"]);

    // And the three names by hand, so the reason survives a refactor of the
    // classifier: none of them is registered.
    for (const name of ["gln", "gld", "glx"]) {
      expect(GLOBALS, `${name} is registered after all`).not.toContain(name);
    }
  });

  it("keeps the two asymmetries asymmetric, over a corpus that is real", () => {
    // gms is bridged under a private name so a bare gms(...) still raises;
    // gmms, gmbs and gks are bound bare because tpad's compiled Setup opens
    // with a bare gmbs(3,0). The gate has to carry both halves, because the
    // difference is invisible in the recipe book.
    expect(GLOBALS, "a bare gms became callable").not.toContain("gms");
    expect(SELF_METHODS, "self:gms stopped being installed").toContain("gms");
    for (const name of ["gmms", "gmbs", "gks"]) {
      expect(GLOBALS, `${name} must stay callable bare`).toContain(name);
    }

    const [bare] = resolveCalls("gms(0,144,60,100,0)");
    expect(bare.ok, "the classifier accepted a bare gms").toBe(false);
    const [method] = resolveCalls("self:gms(0,144,60,100,0)");
    expect(method.ok, "the classifier refused self:gms").toBe(true);

    // The corpus is not empty. Every number above is worthless if the scan ran
    // over nothing, and these two floors are the shipped catalog's own shape
    // with room under it - they do not move when a wave adds entries.
    const entries = luaEntries();
    let sites = 0;
    for (const entry of entries) {
      const rendered = renderLua(entry);
      for (const event of EVENTS) sites += resolveCalls(rendered[event]).length;
    }
    expect(
      entries.length,
      "fewer than six hand-authored entries were scanned",
    ).toBeGreaterThanOrEqual(6);
    expect(
      sites,
      `the scan over ${entries.length} entries at their defaults found only ` +
        `${sites} call sites`,
    ).toBeGreaterThanOrEqual(40);
  });
});
