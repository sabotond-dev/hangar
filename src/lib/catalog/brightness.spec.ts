// The brightness scaler's gate: every colour HANGAR writes is one the scaler reaches (no colour
// argument classified `other` on any Lua entry at any knob state, nor on any preset at its sampled
// states), 255 is the byte-identity on all of them, no string grows at any brightness, every scaled
// string still passes the pinned checkSyntax, and the two tightest entries are measured at 255, 128
// and 1. The rules are pinned on the shapes the tree has: a literal, morph's linear form, a preset's
// per-finger form and ramp, cull's palette, snake's painter.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { compile } from "../../vendor/botor/_pad";
import { measureLua, padReady } from "../pad";
import { compilerKnobs } from "../share/stamp";
import { renderLua } from "../sim/lua-pad-sim";
import { colourIndexOf } from "../tune/knobs.preset";
import { applyKnob, baseStateFor } from "../tune/state";
import {
  BRIGHTNESS_FULL,
  ENTRY_SITES,
  LIBRARY_PAINTERS,
  brightnessOf,
  colourSites,
  paletteCount,
  parseBrightness,
  scaleChannel,
  scaleCoefficient,
  scaleLua,
  sitesFor,
  type ColourSites,
} from "./brightness";
import { CATALOG, byId, type CatalogEntry } from "./index";
import { stripComments } from "../../test-support/source";

type Rendered = { label: string; setup: string; timer: string };

/**
 * A hand-authored entry at its defaults, at the picker corner and at every single-knob position -
 * hash-wire.mjs's E coverage, the wire set's own sample. The whole cross-product is 232,824 states
 * (measured once, 81 s of scanning): the sweep's business, not the quick suite's.
 */
function sampledLuaStates(entry: CatalogEntry): Rendered[] {
  const out: Rendered[] = [];
  const at = (knobs: Record<string, number> | undefined, label: string) => {
    const r = renderLua(entry, knobs);
    out.push({ label: `${entry.id} ${label}`, ...r });
  };
  at(undefined, "defaults");
  const corner: Record<string, number> = {};
  for (const k of entry.knobs) {
    const white = k.values.indexOf("255,255,255");
    corner[k.id] =
      k.kind === "colour" && white >= 0
        ? white
        : k.values.reduce(
            (best, v, i) => (v.length > k.values[best].length ? i : best),
            0,
          );
  }
  at(corner, "corner");
  for (const k of entry.knobs) {
    for (let i = 0; i < k.values.length; i += 1)
      at({ [k.id]: i }, `${k.id}=${i}`);
  }
  return out;
}

/** A preset at its defaults, at the corner, and at every sampled single-knob position - hash-wire.mjs's P coverage. */
function presetStates(entry: CatalogEntry): Rendered[] {
  const knobs = compilerKnobs(entry);
  const base = baseStateFor(entry);
  const at = (indices: number[], label: string): Rendered => {
    let state = base;
    knobs.forEach((k, j) => (state = applyKnob(state, k, indices[j])));
    const built = compile(state);
    return {
      label: `${entry.id} ${label}`,
      setup: built.setupLua,
      timer: built.timerLua,
    };
  };
  const defaults = knobs.map((k) => k.default);
  const out = [
    at(defaults, "defaults"),
    at(
      knobs.map((k) => k.options.length - 1),
      "corner",
    ),
  ];
  const sampleOf = (k: (typeof knobs)[number]): number[] =>
    k.options.length <= 64
      ? k.options.map((_, i) => i)
      : [
          ...new Set([
            k.default,
            ...[0, 17, 255].flatMap((r) =>
              [0, 17, 255].flatMap((g) =>
                [0, 17, 255].map((b) => colourIndexOf({ r, g, b })),
              ),
            ),
          ]),
        ];
  knobs.forEach((k, j) => {
    for (const i of sampleOf(k)) {
      if (i === k.default) continue;
      const idx = defaults.slice();
      idx[j] = i;
      out.push(at(idx, `${k.id}=${i}`));
    }
  });
  return out;
}

const LUA_ENTRIES = CATALOG.filter((e) => e.source.kind === "lua");
const PRESET_ENTRIES = CATALOG.filter((e) => e.source.kind !== "lua");

function mustEntry(id: string): CatalogEntry {
  const entry = byId(id);
  if (entry === undefined) throw new Error(`no catalog entry: ${id}`);
  return entry;
}

describe("the brightness scaler (src/lib/catalog/brightness.ts)", () => {
  beforeAll(async () => {
    await padReady();
  });

  it("1. the rules: 255 is the identity, 128 halves with floor, a lit channel never goes below 1, 0 stays 0; a coefficient floors to 0; the field parses 1..255 and refuses the rest by kind", () => {
    for (let v = 0; v <= 255; v += 1) {
      expect(scaleChannel(v, 255), `channel ${v} at 255`).toBe(v);
      expect(scaleCoefficient(v, 255), `coefficient ${v} at 255`).toBe(v);
    }
    expect(scaleChannel(255, 128)).toBe(128);
    expect(scaleChannel(214, 128)).toBe(107);
    expect(scaleChannel(78, 128)).toBe(39);
    expect(scaleChannel(1, 128), "the min-1 rule").toBe(1);
    expect(scaleChannel(0, 128), "0 stays 0").toBe(0);
    expect(scaleChannel(255, 1)).toBe(1);
    expect(scaleChannel(17, 1), "RGB444's first step at 1 is still lit").toBe(
      1,
    );
    expect(scaleChannel(0, 1)).toBe(0);
    expect(scaleCoefficient(60, 1), "a coefficient may reach 0").toBe(0);
    expect(scaleCoefficient(60, 128)).toBe(30);
    for (let v = 1; v <= 255; v += 1) {
      for (const b of [1, 2, 64, 127, 128, 200, 254, 255]) {
        expect(
          String(scaleChannel(v, b)).length,
          `${v} at ${b} gained a digit`,
        ).toBeLessThanOrEqual(String(v).length);
      }
    }
    expect(brightnessOf(undefined)).toBe(BRIGHTNESS_FULL);
    expect(brightnessOf(128)).toBe(128);
    expect(brightnessOf(0), "out of range reads as full").toBe(255);
    expect(parseBrightness("128")).toEqual({ ok: true, value: 128 });
    expect(parseBrightness(" 1 ")).toEqual({ ok: true, value: 1 });
    expect(parseBrightness("255")).toEqual({ ok: true, value: 255 });
    expect(parseBrightness("0")).toEqual({ ok: false, reason: "range" });
    expect(parseBrightness("256")).toEqual({ ok: false, reason: "range" });
    expect(parseBrightness("-1")).toEqual({ ok: false, reason: "range" });
    expect(parseBrightness("12.5")).toEqual({ ok: false, reason: "number" });
    expect(parseBrightness("")).toEqual({ ok: false, reason: "number" });
    expect(parseBrightness("bright")).toEqual({ ok: false, reason: "number" });
  });

  it("2. the shapes: a literal triplet, morph's linear form (non-negative at every brightness), a preset's per-finger form and drift ramp, cull's palette through its index, snake's painter by name, and a phase never touched", () => {
    const sites = sitesFor();
    expect(scaleLua("glc(a,1,214,255,78,1)", 128, sites)).toBe(
      "glc(a,1,107,128,39,1)",
    );
    expect(scaleLua("glc(a,1,214,255,78,1)", 1, sites)).toBe(
      "glc(a,1,1,1,1,1)",
    );
    expect(
      scaleLua("G(s,i,e,x,y,0,255,255,255)K(x,y,1,252,0,200,255)", 128, sites),
    ).toBe("G(s,i,e,x,y,0,128,128,128)K(x,y,1,252,0,100,128)");
    expect(
      scaleLua("K(x,y,1,252)glp(a,1,255)glpfs(a,1,252,250,0)", 128, sites),
      "K without a colour, a phase, a rate: nothing to scale",
    ).toBe("K(x,y,1,252)glp(a,1,255)glpfs(a,1,252,250,0)");
    // morph: `glc(a,1,255-j*@SPREAD,j*@SPREAD,128,1)` at the widest spread.
    expect(scaleLua("glc(a,1,255-j*85,j*85,128,1)", 128, sites)).toBe(
      "glc(a,1,128-j*42,j*42,64,1)",
    );
    expect(scaleLua("glc(a,1,255-j*85,j*85,128,1)", 1, sites)).toBe(
      "glc(a,1,1-j*0,j*0,1,1)",
    );
    for (let b = 1; b <= 255; b += 1) {
      const A = scaleChannel(255, b);
      const S = scaleCoefficient(85, b);
      expect(A - 3 * S, `morph's fourth corner at ${b}`).toBeGreaterThanOrEqual(
        0,
      );
      const F = scaleCoefficient(60, b);
      expect(A - 4 * F, `the fifth finger at ${b}`).toBeGreaterThanOrEqual(0);
    }
    // The compiler's per-finger form and a drift ramp's three shapes.
    expect(scaleLua("glc(a,1,255-i*60,i*60,128,1)", 128, sites)).toBe(
      "glc(a,1,128-i*30,i*30,64,1)",
    );
    expect(
      scaleLua("gld(a,2,40+200*x//8,255-255*x//8,200*x//8)", 128, sites),
    ).toBe("gld(a,2,20+100*x//8,128-128*x//8,100*x//8)");
    expect(
      scaleLua("glc(a,1,f*80,255-f*60,200-f*60,1)", 128, sites),
      "the fader palette, name times coefficient",
    ).toBe("glc(a,1,f*40,128-f*30,100-f*30,1)");
    // cull: the palette constructor scaled, the indexed reads left alone, the bitmask table untouched.
    const cull = sitesFor("cull");
    expect(
      scaleLua(
        "local M={511,16}local C={255,180,0}glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1]*3//6,C[i+2]*3//6,C[i+3]*3//6,1)",
        128,
        cull,
      ),
    ).toBe(
      "local M={511,16}local C={128,90,0}glc(a,1,C[i+1],C[i+2],C[i+3],1)glc(a,2,C[i+1]*3//6,C[i+2]*3//6,C[i+3]*3//6,1)",
    );
    // snake: the local painter's callers scaled, its definition and body left alone.
    const snake = sitesFor("snake");
    expect(
      scaleLua(
        "local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)end P(k,214,255,78)P(k,0,0,0)",
        128,
        snake,
      ),
    ).toBe(
      "local function P(k,r,g,b)local a=glag(0,k)glc(a,1,r,g,b,1)end P(k,107,128,39)P(k,0,0,0)",
    );
    expect(
      colourSites("s:gms(1,144,60,100,0)glc(glag(0,n),1,0,200,255,1)", sites),
      "a member call is not a painter; a nested call is one argument",
    ).toEqual([
      { painter: "glc", position: 2, text: "0", kind: "literal" },
      { painter: "glc", position: 3, text: "200", kind: "literal" },
      { painter: "glc", position: 4, text: "255", kind: "literal" },
    ]);
    expect(
      colourSites("glc(a,1,q,w,e,1)", sites).map((s) => s.kind),
      "an undeclared bare name is `other`",
    ).toEqual(["other", "other", "other"]);
    expect(Object.keys(LIBRARY_PAINTERS).sort()).toEqual([
      "G",
      "K",
      "glc",
      "gld",
      "gln",
      "glx",
    ]);
  });

  it("3. coverage: every colour argument of every painter call is reached on all nineteen Lua entries at its sampled states and on every preset at its sampled states; every declared site is found, and no undeclared entry needs one", () => {
    for (const id of Object.keys(ENTRY_SITES)) {
      expect(
        byId(id),
        `ENTRY_SITES names "${id}", not a catalog entry`,
      ).toBeDefined();
    }
    let luaStates = 0;
    let luaSites = 0;
    const kinds: Record<string, number> = {};
    for (const entry of LUA_ENTRIES) {
      const sites = sitesFor(entry.id);
      const states = sampledLuaStates(entry);
      luaStates += states.length;
      let found = 0;
      for (const state of states) {
        for (const text of [state.setup, state.timer]) {
          for (const site of colourSites(text, sites)) {
            kinds[site.kind] = (kinds[site.kind] ?? 0) + 1;
            found += 1;
            expect(
              site.kind,
              `${state.label}: ${site.painter} argument ${site.position} "${site.text}" is a colour the scaler cannot reach`,
            ).not.toBe("other");
            expect(
              site.kind,
              `${state.label}: a knob token survived substitution`,
            ).not.toBe("token");
          }
        }
        // A declared palette that is not in the text is a declaration that scales nothing.
        const counts = paletteCount(state.setup + " " + state.timer, sites);
        for (const name of sites.palettes) {
          expect(
            counts[name],
            `${state.label}: palette ${name} declared but not found`,
          ).toBeGreaterThan(0);
        }
      }
      luaSites += found;
      expect(found, `${entry.id}: no colour site at all`).toBeGreaterThan(0);
      // An entry outside ENTRY_SITES is one whose every argument the library painters explain.
      if (ENTRY_SITES[entry.id] === undefined) {
        const bareOrPalette = states.flatMap((s) =>
          colourSites(s.setup + s.timer, sites).filter(
            (site) => site.kind === "bare" || site.kind === "palette",
          ),
        );
        expect(bareOrPalette, `${entry.id}: needs a declaration`).toEqual([]);
      }
    }
    expect(luaStates, "the sampled states").toBeGreaterThan(19 * 3);
    expect(
      kinds.palette,
      "cull, lumen and quadrant read palettes",
    ).toBeGreaterThan(0);
    expect(kinds.bare, "snake, pomodoro and lumen hand names").toBeGreaterThan(
      0,
    );
    expect(kinds.linear, "morph's form").toBeGreaterThan(0);

    let presetStateCount = 0;
    let presetSites = 0;
    for (const entry of PRESET_ENTRIES) {
      const sites = sitesFor();
      for (const state of presetStates(entry)) {
        presetStateCount += 1;
        for (const text of [state.setup, state.timer]) {
          for (const site of colourSites(text, sites)) {
            presetSites += 1;
            expect(
              site.kind,
              `${state.label}: ${site.painter} argument ${site.position} "${site.text}" is a colour the scaler cannot reach`,
            ).not.toBe("other");
          }
        }
      }
    }
    expect(PRESET_ENTRIES.length, "the eight presets").toBe(8);
    expect(presetStateCount).toBeGreaterThan(8 * 2);
    expect(presetSites).toBeGreaterThan(0);
    process.stdout.write(
      `\nBRIGHTNESS COVERAGE: ${LUA_ENTRIES.length} Lua entries x ${luaStates} states, ${luaSites} colour arguments (${Object.entries(
        kinds,
      )
        .map(([k, n]) => `${k} ${n}`)
        .join(
          ", ",
        )}); ${PRESET_ENTRIES.length} presets x ${presetStateCount} states, ${presetSites} colour arguments; none unreachable\n`,
    );
  });

  it("4. the wire: 255 is byte-identical on every string above; at 128 and at 1 no string is longer, every one still passes checkSyntax; Trackpad 903 / Chorus / Console measured at the picker corner at 255, 128 and 1", async () => {
    const all: { label: string; text: string; sites: ColourSites }[] = [];
    for (const entry of LUA_ENTRIES) {
      const sites = sitesFor(entry.id);
      for (const state of sampledLuaStates(entry)) {
        all.push({ label: `${state.label} setup`, text: state.setup, sites });
        all.push({ label: `${state.label} timer`, text: state.timer, sites });
      }
    }
    for (const entry of PRESET_ENTRIES) {
      for (const state of presetStates(entry)) {
        all.push({
          label: `${state.label} setup`,
          text: state.setup,
          sites: sitesFor(),
        });
        all.push({
          label: `${state.label} timer`,
          text: state.timer,
          sites: sitesFor(),
        });
      }
    }
    let moved128 = 0;
    for (const { label, text, sites } of all) {
      expect(scaleLua(text, 255, sites), `${label}: 255 moved a byte`).toBe(
        text,
      );
      for (const b of [128, 1]) {
        const scaled = scaleLua(text, b, sites);
        expect(scaled.length, `${label}: longer at ${b}`).toBeLessThanOrEqual(
          text.length,
        );
        if (b === 128 && scaled !== text) moved128 += 1;
      }
    }
    expect(moved128, "brightness 128 moved most strings").toBeGreaterThan(
      all.length / 2,
    );
    // checkSyntax on every scaled string that is not empty, at 128 and at 1 -
    // the formatter is a WASM call per string.
    let checked = 0;
    const sampled = [
      ...LUA_ENTRIES.flatMap((entry) => {
        const sites = sitesFor(entry.id);
        return sampledLuaStates(entry).map((s) => ({ ...s, sites }));
      }),
      ...PRESET_ENTRIES.flatMap((entry) =>
        presetStates(entry).map((s) => ({ ...s, sites: sitesFor() })),
      ),
    ];
    for (const state of sampled) {
      for (const b of [128, 1]) {
        for (const text of [state.setup, state.timer]) {
          if (text === "") continue;
          const scaled = scaleLua(text, b, state.sites);
          expect(
            GridScript.checkSyntax(scaled),
            `${state.label} at ${b}: the scaled string fails checkSyntax`,
          ).toBe(true);
          checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);

    // The two tightest entries at the RGB444 picker corner (every colour knob 255,255,255).
    const corner = (id: string): { setup: string; timer: string } => {
      const state = sampledLuaStates(mustEntry(id)).find((s) =>
        s.label.endsWith(" corner"),
      );
      if (state === undefined) throw new Error(`${id}: no corner`);
      return state;
    };
    const rows: string[] = [];
    const figures: Record<string, Record<number, [number, number]>> = {};
    for (const id of ["trackpad", "chorus", "console"]) {
      const { setup, timer } = corner(id);
      const sites = sitesFor(id);
      figures[id] = {};
      for (const b of [255, 128, 1]) {
        const s = await measureLua(scaleLua(setup, b, sites));
        const t =
          timer === "" ? 0 : await measureLua(scaleLua(timer, b, sites));
        figures[id][b] = [s, t];
        expect(s, `${id} setup at ${b}`).toBeLessThanOrEqual(908);
        expect(t, `${id} timer at ${b}`).toBeLessThanOrEqual(908);
        rows.push(
          `  ${id.padEnd(9)} at ${String(b).padStart(3)}: Setup ${s}, Timer ${t}`,
        );
      }
      expect(figures[id][128][0]).toBeLessThanOrEqual(figures[id][255][0]);
      expect(figures[id][1][0]).toBeLessThanOrEqual(figures[id][128][0]);
    }
    expect(figures.trackpad[255][0], "Trackpad's Setup at the corner").toBe(
      903,
    );
    expect(
      figures.trackpad[128][0],
      "no colour in Trackpad's Setup: the same 903 at 128",
    ).toBe(903);
    process.stdout.write(
      `\nBRIGHTNESS AT THE PICKER CORNER (measured under compressScript):\n${rows.join("\n")}\n`,
    );
  }, 120000);

  it("5. imports nothing: the module is pure string arithmetic, so a component under src/lib/ui/ may name it (config-shape.spec.ts test 13 permits it by exact path on this proof)", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./brightness.ts", import.meta.url)),
      "utf8",
    );
    expect(source.length, "a real module").toBeGreaterThan(2000);
    const stripped = stripComments(source);
    const specifiers = [...stripped.matchAll(/from[ ]+["']([^"']+)["']/g)].map(
      (m) => m[1],
    );
    expect(specifiers, "no import, not even a type").toEqual([]);
    expect(stripped).not.toMatch(/^[ ]*import[ ]/m);
  });
});
