// The execution gate: every hand-authored configuration actually RUNS.
//
// Three tests, and the count never moves - each loops over the Lua entries
// internally and names the entry in its message, so waves 5 and 6 add
// configurations without touching a number here. The budget, canonical form and
// subset questions belong to src/lib/catalog/lua-entries.sweep.spec.ts; this file asks
// the only question a static analysis cannot: does it work.
//
// Every entry is put through the SAME scripted gesture, so the gate is uniform:
// a drag (a press followed by six moves along a diagonal, two ticks apart), a
// lift, and a fast tap - firmware event 9, which several configurations treat as
// their only programming gesture, and which is coalesced from a sub-cycle
// press-and-lift so it arrives with no separate press or lift of its own.
//
// The engine is assembled here from renderLua plus createLuaHost rather than
// through createEngine, for one reason: the pitfall-1 guard has to read the raw
// layer records, and a SimEngine deliberately exposes only the rendered frame.
// The Lua text and the wrapped simulator are identical either way - this is the
// same construction createLuaPadSim performs.
//
// Set SMOKE_REPORT=1 to print the per-entry MIDI summary test 2 asserts on.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CELLS } from "../../vendor/botor/_pad";
import { PadSim } from "../../vendor/botor/pad-sim";
import { CATALOG, type CatalogEntry } from "../catalog";
import { createLuaHost, type HostMidi } from "./lua-host";
import { blankPadState, renderLua } from "./lua-pad-sim";

/** Ticks after the gesture, long enough for a decay to expire many times. */
const SETTLE_TICKS = 200;

/** Ticks between two gesture steps. One sample is popped per tick. */
const STEP_TICKS = 2;

/**
 * The drag, as fractions of whatever coordinate maximum the entry declared.
 * Fractions rather than pixels because an entry that unlocks the hi-res range
 * with touch_x_max reports 1023 where these report 127, and a fixed coordinate
 * would then land in the bottom-left eighth of its pad.
 */
const DRAG = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

/** The fast tap: off the diagonal, and off both the centre and the border. */
const TAP: readonly [number, number] = [0.15, 0.45];

/**
 * The pitfall-1 signature. See test 3.
 *
 * A keeper is written as the maximum timeout, 65535 - but the LED engine
 * decrements every non-zero timeout on every tick (pad-sim.ts, grid_led_tick),
 * so a keeper written at Setup already reads 65535 minus the ticks since, and
 * an equality test on 65535 could only ever fire on a record sampled inside the
 * one tick that wrote it. The floor below is what makes the guard observable:
 * a timeout still above it after a whole run can only have been written as a
 * keeper, because the longest legitimate countdown anywhere in this phase is
 * 150 ticks and the compiler clamps its own trails to 200.
 */
const KEEPER_TIMEOUT = 65535;
const KEEPER_FLOOR = KEEPER_TIMEOUT - 1024;
const DECAY_RATE_FLOOR = 200;

type Strobe = {
  hw: number;
  layer: number;
  tick: number;
  timeout: number;
  fre: number;
};

type SmokeRun = {
  id: string;
  coordMax: number;
  /** The most lit bytes seen at any tick while a finger was on the pad. */
  litDuringGesture: number;
  gestureTicks: number;
  totalTicks: number;
  errors: readonly string[];
  midi: readonly HostMidi[];
  pendingAtEnd: number;
  strobe: Strobe | null;
};

function luaEntries(): CatalogEntry[] {
  return CATALOG.filter((entry) => entry.source.kind === "lua");
}

function lit(frame: Uint8Array): number {
  let n = 0;
  for (const byte of frame) if (byte !== 0) n += 1;
  return n;
}

/**
 * Build the entry, run the scripted gesture and then SETTLE_TICKS more, and
 * record everything all three tests need in ONE pass.
 *
 * The layer sweep is the expensive half - 243 records per tick - so it happens
 * here rather than three times over. Memoised per entry below, because building
 * a VM and running it for the full run three times would triple the file's cost
 * for no extra evidence.
 */
async function smoke(entry: CatalogEntry): Promise<SmokeRun> {
  const { setup, timer } = renderLua(entry);
  const sim = new PadSim(blankPadState());
  const host = await createLuaHost({
    sim,
    setup,
    timer: timer.trim() === "" ? undefined : timer,
  });
  try {
    const max = host.coordMax;
    const at = (f: number): number => Math.round(f * max);
    let litDuringGesture = 0;
    let strobe: Strobe | null = null;
    let tick = 0;

    const advance = (n: number, watchLight: boolean): void => {
      for (let i = 0; i < n; i += 1) {
        host.tick();
        tick += 1;
        if (watchLight) {
          litDuringGesture = Math.max(litDuringGesture, lit(host.frame));
        }
        if (strobe !== null) continue;
        // Sampled on EVERY tick, not only at the end: the bug this looks for
        // is a state a cell passes through, and a run that only inspected the
        // final tick would miss a keeper that a later write happened to
        // overwrite.
        for (let hw = 0; hw < CELLS; hw += 1) {
          for (const layer of [0, 1, 2] as const) {
            const record = sim.layer(hw, layer);
            if (
              record.timeout >= KEEPER_FLOOR &&
              record.fre >= DECAY_RATE_FLOOR
            ) {
              strobe = {
                hw,
                layer,
                tick,
                timeout: record.timeout,
                fre: record.fre,
              };
              break;
            }
          }
          if (strobe !== null) break;
        }
      }
    };

    // The drag: a press, then six moves down the diagonal, two ticks apart.
    host.touchDown(0, at(DRAG[0]), at(DRAG[0]));
    advance(STEP_TICKS, true);
    for (let i = 1; i < DRAG.length; i += 1) {
      host.touchMove(0, at(DRAG[i]), at(DRAG[i]));
      advance(STEP_TICKS, true);
    }
    // The lift, at the last point the finger reached.
    const last = DRAG[DRAG.length - 1];
    host.touchUp(0, at(last), at(last));
    advance(STEP_TICKS, true);
    // The fast tap, on a second contact.
    host.touchTap(1, at(TAP[0]), at(TAP[1]));
    advance(STEP_TICKS, true);

    const gestureTicks = tick;
    advance(SETTLE_TICKS, false);

    return {
      id: entry.id,
      coordMax: max,
      litDuringGesture,
      gestureTicks,
      totalTicks: tick,
      errors: [...host.errors],
      midi: [...host.midi],
      pendingAtEnd: host.pendingTouches,
      strobe,
    };
  } finally {
    host.close();
  }
}

const memo = new Map<string, Promise<SmokeRun>>();
function runFor(entry: CatalogEntry): Promise<SmokeRun> {
  const existing = memo.get(entry.id);
  if (typeof existing !== "undefined") return existing;
  const started = smoke(entry);
  memo.set(entry.id, started);
  return started;
}

describe("hand-authored Lua entries execute (CONT-02)", () => {
  it("builds, and lights the pad under a finger", async () => {
    // NOT "non-black immediately after Setup". A blank layer's stops are all
    // zero and the sixth argument of the colour call forces the minimum stop
    // black, so a configuration whose only light is a touch response renders an
    // all-zero frame until a finger arrives - and that is a legitimate design,
    // not a failure. What is genuinely broken is a card that never lights AT
    // ALL, and that is what this asks. The rest-state question is a separate
    // declared fact, entry.restsBlack, asserted against the recorded frames by
    // src/lib/catalog/frames.spec.ts, so the two do not fight each other.
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    for (const entry of entries) {
      const run = await runFor(entry);
      expect(
        run.gestureTicks,
        `${entry.id}: the scripted gesture advanced the simulation`,
      ).toBeGreaterThan(0);
      expect(
        run.litDuringGesture,
        `${entry.id}: nothing ever lit during the drag, lift and tap at ` +
          `coordinate maximum ${run.coordMax}`,
      ).toBeGreaterThan(0);
    }
  });

  it("survives the gesture plus two hundred further ticks, and plays", async () => {
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    const report: string[] = [];
    for (const entry of entries) {
      const run = await runFor(entry);
      expect(
        run.errors,
        `${entry.id}: a handler raised - ${run.errors.join(" | ")}`,
      ).toEqual([]);
      expect(
        run.totalTicks,
        `${entry.id}: the settle ran to completion`,
      ).toBeGreaterThanOrEqual(SETTLE_TICKS);
      expect(
        run.pendingAtEnd,
        `${entry.id}: touch samples were left in the queue`,
      ).toBe(0);
      // An entry that plays nothing was not exercised by the gesture. Fix the
      // gesture, never this assertion: a silent instrument is exactly what the
      // gate exists to notice.
      expect(
        run.midi.length,
        `${entry.id}: produced no MIDI at all across ${run.totalTicks} ticks`,
      ).toBeGreaterThan(0);
      report.push(
        `${entry.id}: ${run.midi.length} messages, first three ` +
          run.midi
            .slice(0, 3)
            .map((m) => `(${m.ch},${m.cmd},${m.p1},${m.p2},${m.mode})`)
            .join(" "),
      );
    }
    if ((process.env.SMOKE_REPORT ?? "") !== "") {
      for (const line of report) console.log(line);
    }
  });

  it("never re-arms a keeper on a layer carrying a decaying trail", async () => {
    // PITFALL 1, mechanically excluded. The keeper idiom - a maximum timeout
    // written across every cell - is correct for a background layer the LED
    // engine animates on its own. Applied to a layer whose cells are handed a
    // fast decay rate, it replaces the countdown, the rate keeps decrementing
    // past zero and wraps, and every touched cell strobes forever. Three
    // candidate configurations shipped that bug during research before it was
    // caught, which is why it is asserted rather than reviewed.
    //
    // The two halves together are the signature. A legitimate keeper sits on a
    // continuous background layer whose rate is single-digit, so the rate floor
    // discriminates cleanly and a correct keeper stays green.
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    for (const entry of entries) {
      const run = await runFor(entry);
      const found = run.strobe;
      expect(
        found === null,
        found === null
          ? `${entry.id}: no keeper on a decaying layer`
          : `${entry.id}: hardware index ${found.hw}, layer ${found.layer}, ` +
              `at tick ${found.tick} holds timeout ${found.timeout} - a keeper ` +
              `written as ${KEEPER_TIMEOUT} and counted down since - together ` +
              `with rate ${found.fre}. The trail will never die and the cell ` +
              "will strobe forever",
      ).toBe(true);
    }
  });
});
