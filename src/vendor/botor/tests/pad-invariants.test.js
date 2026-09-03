// Vendored from sabotond-dev/botor
//   path:   src/renderer/tests/pad-invariants.test.js
//   commit: a0fb69d5d0e78ce0f6423fc1d1a9783937c5380c
//   synced: 2026-09-02
// Modified for HANGAR: import paths only (1 specifier).
// Original copyright and licence (GNU GPL v3 or later) retained below.

// Invariant sweep over every reachable pad state, 4860 combinations:
// 1620 kind combinations times three representative brightness levels
// (5 the identity regression, 1 the extreme floor, 3 the odd-percent
// floors; levels 2 and 4 execute no code path the other three do not).
// Deliberately shares no helper with pad.test.js: it re-derives each check
// from the firmware traps so the two suites cannot agree by construction.
import { describe, it, expect, beforeAll } from "vitest";
import { GridScript, initLuaFormatter } from "@intechstudio/grid-protocol";
import {
  padCompilerReady,
  defaultState,
  compile,
  encodeStamp,
  decodeStamp,
  normalisePadState,
  streamsOf,
  soloPadState,
} from "../_pad";

const LOOKS = ["none","breathe","shimmer","scan","wave","swirl","ripple","drift","showpiece"];
const TOUCHES = ["none","comet","perFinger","bloom","glow","disturb"];
// Every sends variant, including the axes, spring and bend sub-dimensions
// on xy, the scale and latch sub-dimensions on zones, and the mode x
// radius sub-dimensions on dial: 1 + 5 + 3 + 1 + 1 + 4 = 15, so the
// sweep enumerates 9 x 6 x 15 x 2 = 1620 kind combinations, times the
// three brightness levels below = 4860 labelled states.
const SENDS = [
  ["none", (s) => { s.sends.kind = "none"; }],
  ["xy-both", (s) => { s.sends.kind = "xy"; }],
  ["xy-x", (s) => { s.sends.kind = "xy"; s.sends.axes = "x"; }],
  ["xy-y", (s) => { s.sends.kind = "xy"; s.sends.axes = "y"; }],
  ["xy-spring", (s) => {
    s.sends.kind = "xy";
    s.sends.spring = true;
    s.sends.springTo = "zero";
  }],
  ["xy-bend-spring", (s) => {
    s.sends.kind = "xy";
    s.sends.bend = "x";
    s.sends.spring = true;
  }],
  ["zones", (s) => { s.sends.kind = "zones"; }],
  ["zones-scale-drawn", (s) => {
    s.sends.kind = "zones";
    s.sends.grid = "4x4";
    s.sends.scale = "pentatonic";
    s.sends.showGrid = true;
  }],
  ["zones-latch-scale-drawn", (s) => {
    s.sends.kind = "zones";
    s.sends.toggle = true;
    s.sends.scale = "major";
    s.sends.showGrid = true;
  }],
  ["faders", (s) => { s.sends.kind = "faders"; }],
  ["trackpad", (s) => { s.sends.kind = "trackpad"; }],
  ["dial-rel", (s) => { s.sends.kind = "dial"; }],
  ["dial-rel-radius", (s) => { s.sends.kind = "dial"; s.sends.dialRadius = true; }],
  ["dial-abs", (s) => { s.sends.kind = "dial"; s.sends.dialMode = "absolute"; }],
  ["dial-abs-radius", (s) => {
    s.sends.kind = "dial";
    s.sends.dialMode = "absolute";
    s.sends.dialRadius = true;
  }],
];

beforeAll(async () => {
  await initLuaFormatter();
  await padCompilerReady();
});

// The brightness axis. Note that a state which lights nothing normalises
// its brightness back to 5, so its b=1 and b=3 rows compile identically
// to b=5; they stay in the sweep because the label, the stamp round trip
// and the audits still exercise that reset.
const BRIGHTNESS_LEVELS = [5, 1, 3];

function* states() {
  for (const look of LOOKS) {
    for (const touch of TOUCHES) {
      for (const [sendsLabel, sends] of SENDS) {
        for (const hiRes of [false, true]) {
          for (const b of BRIGHTNESS_LEVELS) {
            const s = defaultState();
            s.look.kind = look;
            s.enabled.look = look !== "none";
            s.touch.kind = touch;
            s.enabled.touch = touch !== "none";
            sends(s);
            s.enabled.sends = s.sends.kind !== "none";
            s.sends.hiRes = hiRes;
            s.brightness = b;
            yield {
              s: normalisePadState(s),
              label: `${look}/${touch}/${sendsLabel}/hi=${hiRes}/b=${b}`,
            };
          }
        }
      }
    }
  }
}

const scripts = (actions) =>
  (actions ?? []).map((a) => (typeof a === "string" ? a : a.script)).filter(Boolean);
const bodiesOf = (r) => [...scripts(r.setup), ...scripts(r.timer)];

describe("independent audit: every reachable state", () => {
  it("actually enumerates all 4860 states, joystick, scale and latch included", () => {
    // The sweep is only as strong as its enumeration: a silently shrunken
    // generator would green every audit below while checking nothing new.
    // 1620 kind combinations times three brightness levels, deliberately.
    const labels = [...states()].map((st) => st.label);
    expect(labels).toHaveLength(4860);
    expect(labels.filter((l) => l.includes("dial")).length).toBe(
      9 * 6 * 4 * 2 * 3,
    );
    expect(labels.filter((l) => l.includes("xy-")).length).toBe(
      9 * 6 * 5 * 2 * 3,
    );
    expect(labels.filter((l) => l.includes("zones")).length).toBe(
      9 * 6 * 3 * 2 * 3,
    );
    expect(labels.filter((l) => l.includes("latch")).length).toBe(
      9 * 6 * 1 * 2 * 3,
    );
    for (const b of BRIGHTNESS_LEVELS) {
      expect(labels.filter((l) => l.endsWith(`/b=${b}`)).length).toBe(1620);
    }
  });

  it("never exceeds 908 shortified characters in either event", () => {
    const over = [];
    for (const { s, label } of states()) {
      const r = compile(s);
      for (const [ev, actions] of [["setup", r.setup], ["timer", r.timer]]) {
        const n = GridScript.compressScript(scripts(actions).join("")).length;
        if (n > 908) over.push(`${label} ${ev}=${n}`);
      }
    }
    expect(over, over.slice(0, 6).join("; ")).toHaveLength(0);
    // 3564 states x 2 compress calls: well past the 5 s default.
  }, 60000);

  it("dimming never lengthens a body and never costs more than the one stamp char", () => {
    // The physics claim with teeth, in two measures. Bodies: scaling
    // shrinks every emitted stop literal and equal ramp endpoints stay
    // equal, so a dimmed BODY can only shrink or hold against the same
    // state at Full. Whole events (the binding measure, markers and
    // stamp included, re-derived here as max(compressed, raw) exactly
    // like the budget): the format "c" stamp adds at most one character,
    // so a dimmed EVENT never grows by more than 1 and never crosses 908
    // on a state that fit at Full. Some sweep states sit over 908 at
    // Full already; those are the fit ladder's business, not dimming's,
    // and they must not get worse either.
    const eventLen = (lua) =>
      Math.max(GridScript.compressScript(lua).length, lua.length);
    const byBase = new Map();
    for (const { s, label } of states()) {
      const cut = label.lastIndexOf("/b=");
      const base = label.slice(0, cut);
      const b = Number(label.slice(cut + 3));
      const r = compile(s);
      const row = byBase.get(base) ?? {};
      row[b] = {
        setup: GridScript.compressScript(scripts(r.setup).join("")).length,
        timer: GridScript.compressScript(scripts(r.timer).join("")).length,
        eSetup: eventLen(r.setupLua),
        eTimer: eventLen(r.timerLua),
      };
      byBase.set(base, row);
    }
    const bad = [];
    for (const [base, at] of byBase) {
      for (const b of [1, 3]) {
        if (at[b].setup > at[5].setup) {
          bad.push(`${base} b=${b}: setup ${at[b].setup} > ${at[5].setup}`);
        }
        if (at[b].timer > at[5].timer) {
          bad.push(`${base} b=${b}: timer ${at[b].timer} > ${at[5].timer}`);
        }
        for (const ev of ["eSetup", "eTimer"]) {
          if (at[b][ev] > at[5][ev] + 1) {
            bad.push(`${base} b=${b}: ${ev} ${at[b][ev]} > ${at[5][ev]} + 1`);
          }
          if (at[5][ev] <= 908 && at[b][ev] > 908) {
            bad.push(`${base} b=${b}: ${ev} crossed 908 (${at[5][ev]} -> ${at[b][ev]})`);
          }
        }
      }
    }
    expect(bad, bad.slice(0, 6).join("; ")).toHaveLength(0);
  }, 60000);

  it("never emits the three firmware traps", () => {
    const hits = [];
    for (const { s, label } of states()) {
      for (const body of bodiesOf(compile(s))) {
        const flat = body.replace(/\s+/g, " ");
        // 9 DOWNUP is a fast tap with no separate UP, so equality on 5 leaks a contact.
        if (/\be\s*==\s*5\b/.test(flat)) hits.push(`${label}: e==5`);
        // Contact ids are never remapped, so this freezes when finger 0 lifts first.
        if (/if\s+i\s*>\s*0\s+then\s+return\s+end/.test(flat)) hits.push(`${label}: id gate`);
        // Lua 5.5 F2Ieq: a fractional argument silently becomes 0.
        if (/(?<!\/)\/(?!\/)/.test(body)) hits.push(`${label}: bare /`);
      }
    }
    expect(hits, hits.slice(0, 6).join("; ")).toHaveLength(0);
  });

  it("floors every sqrt before it can reach a firmware call", () => {
    const bad = [];
    for (const { s, label } of states()) {
      for (const body of bodiesOf(compile(s))) {
        for (const m of body.matchAll(/math\.sqrt/g)) {
          // The floor may come after further arithmetic, as in
          // math.sqrt(p*p+q*q)*22//1, so look ahead rather than demanding
          // it immediately follows the closing paren.
          const tail = body.slice(m.index, m.index + 60);
          if (!/\/\/|math\.tointeger/.test(tail)) bad.push(`${label}: ${tail.slice(0, 40)}`);
        }
      }
    }
    expect(bad, bad.slice(0, 6).join("; ")).toHaveLength(0);
  });

  it("never emits a controller number above 127", () => {
    const bad = [];
    for (const { s, label } of states()) {
      const raised = normalisePadState({
        ...s,
        sends: { ...s.sends, ccBase: 127 },
      });
      for (const body of bodiesOf(compile(raised))) {
        for (const m of body.matchAll(/gms\([0-9]+,176,([0-9]+)/g)) {
          const cc = Number(m[1]) + (raised.sends.hiRes ? 32 : 0);
          if (cc > 127) bad.push(`${label}: cc ${cc}`);
        }
      }
    }
    expect(bad, bad.slice(0, 6).join("; ")).toHaveLength(0);
  });

  it("never sets a phase on a layer whose colour was never set", () => {
    const bad = [];
    for (const { s, label } of states()) {
      for (const body of bodiesOf(compile(s))) {
        const phased = new Set(
          [...body.matchAll(/gl(?:p|pfs)\([^,]+,([12])/g)].map((m) => m[1]),
        );
        const coloured = new Set(
          [...body.matchAll(/gl(?:c|n|d|x)\([^,]+,([12])/g)].map((m) => m[1]),
        );
        for (const layer of phased) {
          if (!coloured.has(layer)) bad.push(`${label}: layer ${layer} phase, no colour`);
        }
      }
    }
    expect(bad, bad.slice(0, 8).join("; ")).toHaveLength(0);
  });

  it("round-trips the stamp for every reachable state", () => {
    const bad = [];
    for (const { s, label } of states()) {
      const back = decodeStamp(encodeStamp(s));
      if (!back) {
        bad.push(`${label}: decode returned nothing`);
        continue;
      }
      const a = normalisePadState(s);
      const b = normalisePadState(back);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        const diff = [];
        for (const grp of ["look", "touch", "sends", "enabled", "calib"]) {
          for (const k of Object.keys(a[grp] ?? {})) {
            const x = JSON.stringify(a[grp][k]);
            const y = JSON.stringify(b[grp]?.[k]);
            if (x !== y) diff.push(`${grp}.${k}: ${x} -> ${y}`);
          }
        }
        bad.push(`${label}: ${diff.join(", ") || "top-level differs"}`);
      }
    }
    expect(bad, bad.slice(0, 4).join(" || ")).toHaveLength(0);
  });

  it("keeps every solo variant inside every audit, under the real card's stamp", () => {
    // The solo sweep: every soloable stream of every state compiles a
    // variant that must pass the same five audits, emit only its own
    // stream's controller numbers, and stamp IDENTICALLY to the base card
    // so a solo can never be mistaken for the user's configuration.
    const bad = [];
    for (const { s, label } of states()) {
      for (const stream of streamsOf(s)) {
        if (!stream.soloable) continue;
        const solo = soloPadState(s, stream.id);
        const r = compile(solo);
        const who = `${label} solo=${stream.id}`;

        if (encodeStamp(solo) !== encodeStamp(s)) {
          bad.push(`${who}: stamp differs from the base card`);
        }
        for (const [ev, actions] of [["setup", r.setup], ["timer", r.timer]]) {
          const lua = actions.map((a) => a.script).join("");
          const n = GridScript.compressScript(lua).length;
          if (n > 908) bad.push(`${who}: ${ev}=${n} over budget`);
        }
        for (const body of bodiesOf(r)) {
          const flat = body.replace(/\s+/g, " ");
          if (/\be\s*==\s*5\b/.test(flat)) bad.push(`${who}: e==5`);
          if (/if\s+i\s*>\s*0\s+then\s+return\s+end/.test(flat)) bad.push(`${who}: id gate`);
          if (/(?<!\/)\/(?!\/)/.test(body)) bad.push(`${who}: bare /`);
          for (const m of body.matchAll(/math\.sqrt/g)) {
            const tail = body.slice(m.index, m.index + 60);
            if (!/\/\/|math\.tointeger/.test(tail)) bad.push(`${who}: unfloored sqrt`);
          }
          const phased = new Set(
            [...body.matchAll(/gl(?:p|pfs)\([^,]+,([12])/g)].map((m) => m[1]),
          );
          const coloured = new Set(
            [...body.matchAll(/gl(?:c|n|d|x)\([^,]+,([12])/g)].map((m) => m[1]),
          );
          for (const layer of phased) {
            if (!coloured.has(layer)) bad.push(`${who}: layer ${layer} phase, no colour`);
          }
        }

        // Only stream S's numbers among the soloable streams' numbers.
        // Fader controllers are symbolic (base + f), so the fader check is
        // the guard itself; xy and dial carry literal controllers.
        const sends = r.setup.map((a) => a.script).join("");
        const nums = [...sends.matchAll(/gms\([0-9]+,176,([0-9]+)[,+]/g)].map(
          (m) => Number(m[1]),
        );
        const cc = s.sends.ccBase;
        if (stream.id === "xy.x" && nums.includes(cc + 1)) {
          bad.push(`${who}: y controller leaked`);
        }
        if (stream.id === "xy.y" && nums.includes(cc)) {
          bad.push(`${who}: x controller leaked`);
        }
        if (stream.id === "dial.turn" && nums.includes(cc + 1)) {
          bad.push(`${who}: radius controller leaked`);
        }
        if (stream.id === "dial.radius" && nums.includes(cc)) {
          bad.push(`${who}: turn controller leaked`);
        }
        const fader = /^fader\.(\d+)$/.exec(stream.id);
        if (fader !== null && !sends.includes(`if f==${fader[1]} then`)) {
          bad.push(`${who}: missing the fader guard`);
        }
      }
    }
    expect(bad, bad.slice(0, 6).join("; ")).toHaveLength(0);
  }, 60000);
});
