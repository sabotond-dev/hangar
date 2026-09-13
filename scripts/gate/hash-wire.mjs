// Phase 13.2 wire-hash harness (scripts/gate/): one sha256 per Lua string HANGAR can put on a ZONA, and one
// for the whole set. Run before and after every refactor plan; the set hash must not move.
//
//   node hash-wire.mjs            defaults + picker corner + per-knob single sweeps (fast, ~10 s)
//   node hash-wire.mjs --full     also the whole knob cross-product of every entry (slower)
//   node hash-wire.mjs --sandbox  also every Sandbox surface the two specs build (a SECOND set line)
//   node hash-wire.mjs --out F    write the JSON record to F (default: hash-wire.<HEAD>.json here)
//
// Coverage:
//   L   library.ts: TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER, every LIBRARY_PARTS row
//   F   protocol/constants.ts: the five firmware defaults the store substitutes and CLEAR writes
//   E   every hand-authored catalog entry (source.kind === "lua"): renderLua at the defaults, at the
//       picker corner (colour knobs 255,255,255 - every other knob its longest literal), and every
//       single-knob position from the defaults; with --full the whole cross-product
//   P   every ported preset entry: the vendored compiler's setupLua/timerLua at the defaults, at every
//       single-knob position (a colour knob sampled at the sweep's 27 lattice colours), and at the
//       "corner" (every knob at its last index); with --full the cross-product over the same samples
//   S   the Sandbox's five strings for the PDF's page-3 surface (runtime.spec.ts's PAGE3), through
//       landSurface (canonical) and emitSurface (raw), at the picker corner and at the default colour;
//       with --sandbox every fixture in sandbox-fixtures.mjs (runtime.spec.ts's and emit.spec.ts's
//       surfaces) the same way plus emitSurface under 2 and 3 slots - recorded and hashed apart as
//       the SANDBOX SET, so the base SET line reads the same with or without the flag
//
// Everything is imported straight from the tree (Node 24 strips types); nothing is written to it.
// Run with the extension hook: node --import ./scripts/gate/ts-ext-register.mjs scripts/gate/hash-wire.mjs
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

// The repo root, resolved from scripts/gate/; the records go under the phase's gate/ directory.
const H = fileURLToPath(new URL("../../", import.meta.url))
  .replace(/\\/g, "/")
  .replace(/\/$/, "");
const SP = `${H}/.planning/phases/13.2-readability/gate`;
const FULL = process.argv.includes("--full");
const SANDBOX = process.argv.includes("--sandbox");
const outIdx = process.argv.indexOf("--out");
const head = execSync("git rev-parse --short HEAD", { cwd: H })
  .toString()
  .trim();
const dirty =
  execSync("git status --porcelain -- src", { cwd: H }).toString().trim() !==
  "";
const OUT =
  outIdx >= 0
    ? process.argv[outIdx + 1]
    : `${SP}/hash-wire.${head}${dirty ? "-dirty" : ""}.json`;

const imp = (rel) => import(pathToFileURL(`${H}/${rel}`).href);
const gp = await imp("node_modules/@intechstudio/grid-protocol/dist/index.js");
await gp.initLuaFormatter();
const pad = await imp("src/vendor/botor/_pad.ts");
const lib = await imp("src/lib/catalog/library.ts");
const catalog = await imp("src/lib/catalog/index.ts");
const luaSim = await imp("src/lib/sim/lua-pad-sim.ts");
const knobsPreset = await imp("src/lib/tune/knobs.preset.ts");
const tuneState = await imp("src/lib/tune/state.ts");
const stamp = await imp("src/lib/share/stamp.ts");
const constants = await imp("src/lib/protocol/constants.ts");
const land = await imp("src/lib/sandbox/land.ts");
const emit = await imp("src/lib/sandbox/emit.ts");
const cost = await imp("src/lib/sandbox/cost.ts");
const fixtures = SANDBOX
  ? (await import("./sandbox-fixtures.mjs")).SANDBOX_FIXTURES
  : {};

const sha = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const record = {}; // name -> { sha256, length }
let strings = 0;
const put = (name, text) => {
  if (typeof text !== "string") throw new Error(`${name}: not a string`);
  record[name] = { sha256: sha(text), length: text.length };
  strings += 1;
};

// L: the library
put("L/TOUCH_LIBRARY (255/0)", lib.TOUCH_LIBRARY);
put("L/TOUCH_LIBRARY_TIMER (255/6)", lib.TOUCH_LIBRARY_TIMER);
for (const part of lib.LIBRARY_PARTS)
  put(`L/part ${part.name} (slot ${part.slot})`, part.lua);

// F: the firmware defaults
put("F/TOUCH_DEFAULT_SETUP (0/0)", constants.TOUCH_DEFAULT_SETUP);
put("F/TOUCH_DEFAULT_TIMER (0/6)", constants.TOUCH_DEFAULT_TIMER);
put("F/SYSTEM_DEFAULT_SETUP (255/0)", constants.SYSTEM_DEFAULT_SETUP);
put("F/SYSTEM_DEFAULT_TIMER (255/6)", constants.SYSTEM_DEFAULT_TIMER);
put("F/SYSTEM_DEFAULT_UTILITY (255/4)", constants.SYSTEM_DEFAULT_UTILITY);

// E: hand-authored entries
const product = (lists, visit) => {
  const idx = lists.map(() => 0);
  let n = 0;
  for (;;) {
    visit(idx.slice());
    n += 1;
    let k = lists.length - 1;
    while (k >= 0) {
      idx[k] += 1;
      if (idx[k] < lists[k].length) break;
      idx[k] = 0;
      k -= 1;
    }
    if (k < 0) return n;
  }
};
const luaEntries = catalog.CATALOG.filter((e) => e.source.kind === "lua");
const presetEntries = catalog.CATALOG.filter((e) => e.source.kind !== "lua");
let luaStates = 0;
for (const entry of luaEntries) {
  const at = (knobs, label) => {
    const r = luaSim.renderLua(entry, knobs);
    put(`E/${entry.id}/${label}/setup`, r.setup);
    put(`E/${entry.id}/${label}/timer`, r.timer);
  };
  at(undefined, "defaults");
  // the picker corner: colour knobs at 255,255,255 by string substitution, others at their longest value
  {
    let setup = entry.source.setup;
    let timer = entry.source.timer;
    for (const k of entry.knobs) {
      const v =
        k.kind === "colour"
          ? "255,255,255"
          : k.values.reduce((a, b) => (b.length > a.length ? b : a));
      setup = setup.split(k.token).join(v);
      timer = timer.split(k.token).join(v);
    }
    put(`E/${entry.id}/corner/setup`, setup);
    put(`E/${entry.id}/corner/timer`, timer);
  }
  for (const k of entry.knobs)
    for (let i = 0; i < k.values.length; i++)
      at({ [k.id]: i }, `knob ${k.id}=${i}`);
  if (FULL) {
    const h = createHash("sha256");
    const n = product(
      entry.knobs.map((k) => k.values),
      (idx) => {
        const knobs = {};
        entry.knobs.forEach((k, j) => (knobs[k.id] = idx[j]));
        const r = luaSim.renderLua(entry, knobs);
        h.update(r.setup).update("\u0000").update(r.timer).update("\u0001");
      },
    );
    luaStates += n;
    record[`E/${entry.id}/cross-product (${n} states)`] = {
      sha256: h.digest("hex"),
      length: n,
    };
    strings += 1;
  }
}

// P: the ported presets through the vendored compiler
let presetStates = 0;
for (const entry of presetEntries) {
  const knobs = stamp.compilerKnobs(entry);
  const base = tuneState.baseStateFor(entry);
  const compileAt = (indices, label) => {
    let state = base;
    knobs.forEach(
      (k, j) => (state = tuneState.applyKnob(state, k, indices[j])),
    );
    const built = pad.compile(state);
    put(`P/${entry.id}/${label}/setup`, built.setupLua);
    put(`P/${entry.id}/${label}/timer`, built.timerLua);
    return built;
  };
  const defaults = knobs.map((k) => k.default);
  compileAt(defaults, "defaults");
  compileAt(
    knobs.map((k) => k.options.length - 1),
    "corner (every knob last)",
  );
  // a colour knob is the whole RGB444 lattice (4,096 options); it is sampled the way the sweep
  // samples it - channels 0, 17 and 255 in every position (27 colours) - through colourIndexOf.
  const sampleOf = (k) =>
    k.options.length <= 64
      ? k.options.map((_, i) => i)
      : [
          ...new Set([
            k.default,
            ...[0, 17, 255].flatMap((r) =>
              [0, 17, 255].flatMap((g) =>
                [0, 17, 255].map((b) => knobsPreset.colourIndexOf({ r, g, b })),
              ),
            ),
          ]),
        ];
  knobs.forEach((k, j) => {
    for (const i of sampleOf(k)) {
      if (i === k.default) continue;
      const idx = defaults.slice();
      idx[j] = i;
      compileAt(idx, `knob ${k.id}=${i}`);
    }
  });
  if (FULL) {
    const h = createHash("sha256");
    const n = product(
      knobs.map((k) => sampleOf(k)),
      (pos) => {
        const idx = pos.map((p, j) => sampleOf(knobs[j])[p]);
        let state = base;
        knobs.forEach(
          (k, j) => (state = tuneState.applyKnob(state, k, idx[j])),
        );
        const built = pad.compile(state);
        h.update(built.setupLua)
          .update("\u0000")
          .update(built.timerLua)
          .update("\u0001");
      },
    );
    presetStates += n;
    record[`P/${entry.id}/cross-product (${n} states)`] = {
      sha256: h.digest("hex"),
      length: n,
    };
    strings += 1;
  }
}

// S: the Sandbox's page-3 surface (runtime.spec.ts's PAGE3, verbatim shape)
const region = (name, kind, col, row, w, h, cc, extra = {}) => ({
  id: name.toLowerCase(),
  name,
  kind,
  col,
  row,
  w,
  h,
  cc,
  channel: 1,
  colour: [15, 15, 15],
  ...extra,
});
const PAGE3 = {
  id: "page 3",
  name: "Page 3",
  regions: [
    region("Filter", "fader", 0, 0, 2, 6, 20),
    region("Space", "xy", 3, 0, 3, 3, 21, { cc2: 22 }),
    region("Turn", "knob", 3, 4, 3, 3, 23),
    region("Go", "button", 7, 0, 2, 2, 30),
  ],
};
{
  const landing = await land.landSurface(PAGE3);
  for (const [k, v] of Object.entries(landing.config))
    put(`S/page3/landed/${k}`, v);
  const own = emit.emitSurface(PAGE3, { slots: land.LANDING_SLOTS });
  put("S/page3/emitted/setup", own.setup);
  put("S/page3/emitted/timer", own.timer);
  put("S/page3/emitted/mapmode", own.mapmode ?? "");
  const corner = cost.atPickerCorner(PAGE3);
  const ownCorner = emit.emitSurface(corner, { slots: land.LANDING_SLOTS });
  put("S/page3/emitted-at-corner/setup", ownCorner.setup);
  put("S/page3/emitted-at-corner/timer", ownCorner.timer);
  put("S/page3/emitted-at-corner/mapmode", ownCorner.mapmode ?? "");
  const two = emit.emitSurface(PAGE3, { slots: 2 });
  put("S/page3/emitted-2-slots/setup", two.setup);
  put("S/page3/emitted-2-slots/timer", two.timer);
}

// S under --sandbox: every fixture the two specs build, hashed apart from the base set
const sandbox = {}; // name -> { sha256, length }
let sandboxStrings = 0;
const putS = (name, text) => {
  if (typeof text !== "string") throw new Error(`${name}: not a string`);
  sandbox[name] = { sha256: sha(text), length: text.length };
  sandboxStrings += 1;
};
for (const [name, fixture] of Object.entries(fixtures)) {
  const landing = await land.landSurface(fixture);
  for (const [k, v] of Object.entries(landing.config))
    putS(`S/${name}/landed/${k}`, v);
  for (const slots of [2, 3]) {
    const own = emit.emitSurface(fixture, { slots });
    putS(`S/${name}/emitted-${slots}-slots/setup`, own.setup);
    putS(`S/${name}/emitted-${slots}-slots/timer`, own.timer);
    putS(`S/${name}/emitted-${slots}-slots/mapmode`, own.mapmode ?? "");
  }
  const ownCorner = emit.emitSurface(cost.atPickerCorner(fixture), {
    slots: land.LANDING_SLOTS,
  });
  putS(`S/${name}/emitted-at-corner/setup`, ownCorner.setup);
  putS(`S/${name}/emitted-at-corner/timer`, ownCorner.timer);
  putS(`S/${name}/emitted-at-corner/mapmode`, ownCorner.mapmode ?? "");
}
const sandboxNames = Object.keys(sandbox).sort();
const sandboxHash = SANDBOX
  ? sha(sandboxNames.map((n) => `${n} ${sandbox[n].sha256}\n`).join(""))
  : undefined;

// the set
const names = Object.keys(record).sort();
const setHash = sha(names.map((n) => `${n} ${record[n].sha256}\n`).join(""));
const out = {
  head,
  dirty,
  full: FULL,
  strings,
  luaEntries: luaEntries.length,
  presetEntries: presetEntries.length,
  luaStates,
  presetStates,
  set: setHash,
  record,
  ...(SANDBOX
    ? {
        sandboxStrings,
        sandboxFixtures: Object.keys(fixtures).length,
        sandboxSet: sandboxHash,
        sandbox,
      }
    : {}),
};
writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const n of names)
  console.log(
    `${record[n].sha256.slice(0, 16)}  ${String(record[n].length).padStart(6)}  ${n}`,
  );
console.log(
  `\n${strings} strings from ${luaEntries.length} Lua entries + ${presetEntries.length} presets + library + defaults + Sandbox page 3${FULL ? ` (+ cross-products: ${luaStates} Lua states, ${presetStates} preset states)` : ""}`,
);
console.log(
  `SET sha256 ${setHash}  (HEAD ${head}${dirty ? ", src dirty" : ""})  -> ${OUT}`,
);
if (SANDBOX) {
  for (const n of sandboxNames)
    console.log(
      `${sandbox[n].sha256.slice(0, 16)}  ${String(sandbox[n].length).padStart(6)}  ${n}`,
    );
  console.log(
    `\n${sandboxStrings} Sandbox strings from ${Object.keys(fixtures).length} fixtures (runtime.spec.ts and emit.spec.ts) through landSurface, emitSurface under 2 and 3 slots, and at the picker corner`,
  );
  console.log(
    `SANDBOX SET sha256 ${sandboxHash}  (HEAD ${head}${dirty ? ", src dirty" : ""})`,
  );
}
