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
// Set SMOKE_REPORT=1 to print the per-entry MIDI and HID summary test 2 asserts
// on.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CELLS, PRESETS, compile } from "../../vendor/botor/_pad";
import { PadSim, screenToHw } from "../../vendor/botor/pad-sim";
import { CATALOG, type CatalogEntry } from "../catalog";
import { createLuaHost, type HostHid, type HostMidi } from "./lua-host";
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
  /** gmms, gmbs and gks - recorded and inert. See test 2. */
  hid: readonly HostHid[];
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
      hid: [...host.hid],
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

// ---------------------------------------------------------------------------
// THE TWO BEHAVIOURAL PROBES (plan 11-02)
//
// Tests 1 to 3 above and the two syntactic gates - decay-idiom.spec.ts and
// touch-guard.spec.ts - all ask about the SHAPE of a configuration. These two
// ask what it DOES, because a source scan cannot see a stuck pixel and cannot
// see a message that was never sent.
// ---------------------------------------------------------------------------

/**
 * The residue probe's gesture point, in fractions of the coordinate maximum.
 *
 * DELIBERATELY INSIDE THE TOP-LEFT NINTH. Any entry laid out as a 3x3 of zones
 * puts this in zone 0, which is the zone a 3x3 latch starts on - so tapping it
 * TWICE returns the latch to exactly where Setup left it and a genuine state
 * change is not counted as residue. STAGE is the case: it is a scene switcher
 * whose whole purpose is a latch, and it passes this probe with no allowance
 * because the gesture is chosen rather than because the entry is excused.
 *
 * AND DELIBERATELY AT COLUMN 2, ROW 2 OF THE NINE-WIDE MAPPING, NOT COLUMN 1.
 * MORPH's four macro quads sit at cells {0,1,9,10}, {7,8,16,17}, {63,64,72,73}
 * and {70,71,79,80}, and they carry an allowance in the table below. A tap at
 * column 1 row 1 lands on cell 10, which is INSIDE that quad, so the allowance
 * would excuse MORPH's comet trail as well as its macros - and the comet is the
 * one thing on that card this probe exists to watch. Cell 20 is in zone 0 and
 * in no macro quad, which is what makes the allowance narrow rather than a skip
 * wearing a reason.
 */
const RESIDUE_TAP: readonly [number, number] = [0.25, 0.25];

/** Ticks before the first tap, between the two taps, and after the second. */
const RESIDUE_WARMUP = 20;
const RESIDUE_GAP = 30;

/**
 * The parity probe's cell, and it is NOT the smoke gesture's TAP.
 *
 * TAP lands on row 4 of a nine-wide mapping, which is the middle row - and the
 * middle row is CONSOLE's default fader level and QUADRANT's dead cross. Both
 * entries therefore sent NOTHING on either run and passed the probe vacuously,
 * observed on the first run of it. Row 5 moves a fader off its default and
 * lands inside one of QUADRANT's four zones, so both are exercised. The
 * non-vacuity assertion at the end of the test is what keeps this honest: an
 * entry that sends nothing on BOTH runs is declared, never quietly counted.
 */
const PARITY_TAP: readonly [number, number] = [0.15, 0.65];

/** Ticks a slow press is held in the parity probe. */
const PARITY_HOLD = 6;

/**
 * Ticks the parity probe runs AFTER the gesture, and it is deliberately longer
 * than SETTLE_TICKS.
 *
 * A watchdog release is part of what a fast tap sends. CHORUS and LATTICE both
 * hold a chord until twenty 100 ms Timer ticks have passed with no event on
 * that contact, because a coalesced tap brings no lift of its own and a
 * note-off driven only by the touch callback would hang a track. That is 200
 * simulator ticks after the tap; a probe settling for 200 measures the watchdog
 * rather than the tap, and 400 clears it with the same margin again. Found by
 * running this probe, which reported CHORUS as sending three note-ons and no
 * note-offs when the note-offs were one Timer tick away.
 */
const PARITY_SETTLE = 400;

/**
 * The gaps between the residue probe's samples, after the settle.
 *
 * SEVERAL SAMPLES, BECAUSE FROZEN IS THE WHOLE POINT. A layer the configuration
 * is still driving - ARC's heart, SNAKE's head, any Timer repainting a cell -
 * is alive, not residue, and its phase moves between samples. A layer whose
 * countdown expired above zero cannot move again: nothing decrements an expired
 * timeout and no Timer is coming back. The probe therefore reports only what is
 * non-zero AND identical at every sample.
 *
 * THE GAPS ARE UNEVEN ON PURPOSE, AND THE EVEN ONE WAS A REAL FALSE POSITIVE.
 * A first cut sampled twice, 40 ticks apart. GHOST re-arms the same decay from
 * a Timer running every 2 ticks, so its phase is periodic with period 2 and two
 * samples 40 apart ALIAS ONTO THE SAME POINT of that cycle - the probe called
 * a repainting cell frozen and named a bug that was not there. 1 and 7 are odd
 * and mutually coprime, so no timer period the catalog uses can hide behind
 * all three.
 */
const RESIDUE_SAMPLE_GAPS: readonly number[] = [1, 7, 32];

/**
 * A layer a gesture is ALLOWED to leave frozen above zero, with the reason.
 *
 * NEVER A SKIP. A skipped entry is an entry nobody is checking; a row here
 * names the cells, says why the state is legitimate, and leaves every other
 * cell in that entry under the probe. Test 4 fails a row that no longer
 * matches anything, so an allowance cannot outlive the design that earned it.
 */
type ResidueAllowance = {
  readonly entry: string;
  /** Hardware cell indices, 0..80, in screen order. */
  readonly cells: readonly number[];
  readonly reason: string;
};

/** One layer's state at one tick: everything the comparison needs. */
type LayerSample = { readonly sha: number; readonly pha: number };

/** One sample: every layer by HARDWARE index, and the rendered SCREEN frame. */
type Sample = {
  readonly layers: readonly (readonly LayerSample[])[];
  readonly frame: Uint8Array;
};

type ResidueRun = {
  readonly samples: readonly Sample[];
  readonly errors: readonly string[];
  readonly coordMax: number;
};

const LAYERS = [0, 1, 2] as const;

function snapshot(sim: PadSim, frame: Uint8Array): Sample {
  const layers: LayerSample[][] = [];
  for (let hw = 0; hw < CELLS; hw += 1) {
    layers.push(
      LAYERS.map((layer) => {
        const record = sim.layer(hw, layer);
        return { sha: record.sha, pha: record.pha };
      }),
    );
  }
  return { layers, frame: Uint8Array.from(frame) };
}

/** Is this screen cell showing anything at all? */
function litAt(frame: Uint8Array, cell: number): boolean {
  const i = cell * 3;
  return frame[i] !== 0 || frame[i + 1] !== 0 || frame[i + 2] !== 0;
}

function rgbAt(frame: Uint8Array, cell: number): string {
  const i = cell * 3;
  return `[${frame[i]},${frame[i + 1]},${frame[i + 2]}]`;
}

/**
 * The sixteen cells MORPH's four macro quads occupy, in the entry's own
 * arithmetic: k = {0,7,63,70} and each quad is base + d%2 + d//2*9.
 */
const MORPH_MACROS: readonly number[] = [0, 7, 63, 70].flatMap((base) =>
  [0, 1, 2, 3].map((d) => base + (d % 2) + Math.floor(d / 2) * 9),
);

/**
 * CONSOLE's fader column 1, between its default level and the tapped one.
 *
 * Setup sets every fader to 4. The gesture lands at column 2, row 2, and the
 * entry reads a level off the row as h = 8 - r = 6, so rows 3 and 4 of that
 * column light where the default level left them dark. Derived here from the
 * entry's own two lines rather than pasted as numbers.
 */
const CONSOLE_TAPPED_COLUMN = 2;
const CONSOLE_FADER: readonly number[] = [3, 4].map(
  (row) => CONSOLE_TAPPED_COLUMN + row * 9,
);

const RESIDUE_ALLOWANCES: readonly ResidueAllowance[] = [
  {
    entry: "morph",
    cells: MORPH_MACROS,
    reason:
      "MORPH is an XY macro controller and these sixteen cells ARE its four " +
      "macro readouts - Setup paints them at phase 0 and every touch writes " +
      "the value it just sent to them. A touched MORPH is supposed to show " +
      "four non-zero macros, and no coordinate exists that returns all four " +
      "to zero (the four products of x, y, 127-x and 127-y cannot all vanish " +
      "at once), so this cannot be double-tapped away. The comet trail on " +
      "layer 2 is NOT allowed here and is exactly what the probe watches.",
  },
  {
    entry: "console",
    cells: CONSOLE_FADER,
    reason:
      "CONSOLE is a nine-channel mixer and these three cells are fader 1 " +
      "between the level Setup gave it and the level the gesture set. A fader " +
      "is an ABSOLUTE control, not a toggle, so a second tap at the same row " +
      "sets the same level again rather than undoing it - it cannot be " +
      "double-tapped back and it should not be. The other eight columns and " +
      "the whole mute row stay under the probe.",
  },
];

/**
 * The two renderings the residue probe runs, and the second one is not
 * decoration.
 *
 * WHERE A DECAY FREEZES DEPENDS ON THE KNOB, AND THE DEFAULT IS NOT THE WORST.
 * MORPH's broken pair froze at phase 3 at its DEFAULT trail length, which
 * renders as rgb [1,1,1] - lit, and caught, but only just. At the first
 * declared value of the same knob it freezes at 129 and the cell is
 * unmistakably lit. One rendering would have staked the whole probe on whichever
 * value an author happened to make the default.
 *
 * TWO RENDERINGS IS A SAMPLE, NOT A PROOF, and the division of labour is
 * deliberate: src/lib/catalog/decay-idiom.spec.ts checks EVERY declared value
 * of every knob, arithmetically, and this probe checks that the arithmetic
 * reaches the picture.
 */
const RESIDUE_RENDERINGS = ["defaults", "first value of every knob"] as const;
type Rendering = (typeof RESIDUE_RENDERINGS)[number];

function indicesFor(
  entry: CatalogEntry,
  rendering: Rendering,
): Record<string, number> | undefined {
  if (rendering === "defaults") return undefined;
  const out: Record<string, number> = {};
  for (const knob of entry.knobs) out[knob.id] = 0;
  return out;
}

/** One host and the sim behind it, built exactly as `smoke` builds them. */
async function open(entry: CatalogEntry, rendering: Rendering = "defaults") {
  const { setup, timer } = renderLua(entry, indicesFor(entry, rendering));
  const sim = new PadSim(blankPadState());
  const host = await createLuaHost({
    sim,
    setup,
    timer: timer.trim() === "" ? undefined : timer,
  });
  return { host, sim };
}

/**
 * Run one entry for the same tick count with and without a double tap.
 *
 * Both hosts see the same number of ticks and the same timer schedule, so an
 * entry whose Timer animates forever is compared at the same moment in its own
 * cycle rather than against a settled picture it never has.
 */
async function residue(
  entry: CatalogEntry,
  gesture: boolean,
  rendering: Rendering,
): Promise<ResidueRun> {
  const { host, sim } = await open(entry, rendering);
  try {
    const at = (f: number): number => Math.round(f * host.coordMax);
    const x = at(RESIDUE_TAP[0]);
    const y = at(RESIDUE_TAP[1]);
    const advance = (n: number): void => {
      for (let i = 0; i < n; i += 1) host.tick();
    };
    advance(RESIDUE_WARMUP);
    if (gesture) host.touchTap(0, x, y);
    advance(RESIDUE_GAP);
    // THE SECOND TAP IS THE LATCH RESET. A toggle - a sequencer step, a scene,
    // a mute - is a legitimate state change, and counting it as residue would
    // make this probe fail on correct entries and be switched off.
    //
    // IT IS ONE COORDINATE UNIT AWAY, AND THAT IS NOT COSMETIC. The host's
    // enqueue is CHANGE-GATED per contact on (event, x, y), so a second
    // touchTap at exactly the same point on the same contact is silently
    // dropped and the reset never happens. Found by running this probe, which
    // then reported SONAR's toggled step - a cell the user asked to light - as
    // residue. One unit is the same LED cell in every mapping the catalog uses,
    // which the assertion below proves rather than assumes.
    if (gesture) host.touchTap(0, x + 1, y + 1);
    advance(SETTLE_TICKS);
    const samples = [snapshot(sim, host.frame)];
    for (const gap of RESIDUE_SAMPLE_GAPS) {
      advance(gap);
      samples.push(snapshot(sim, host.frame));
    }
    return {
      samples,
      errors: [...host.errors],
      coordMax: host.coordMax,
    };
  } finally {
    host.close();
  }
}

/** Every MIDI and HID message one entry sent, as comparable strings. */
type Sent = readonly string[];

async function parity(entry: CatalogEntry, fast: boolean): Promise<Sent> {
  const { host } = await open(entry);
  try {
    const at = (f: number): number => Math.round(f * host.coordMax);
    const x = at(PARITY_TAP[0]);
    const y = at(PARITY_TAP[1]);
    const advance = (n: number): void => {
      for (let i = 0; i < n; i += 1) host.tick();
    };
    advance(RESIDUE_WARMUP);
    if (fast) {
      // ONE message, event code 9, with no separate press and no separate
      // lift. touchTap is the only path in the whole simulator that makes one.
      host.touchTap(0, x, y);
      advance(PARITY_HOLD);
    } else {
      host.touchDown(0, x, y);
      advance(PARITY_HOLD);
      host.touchUp(0, x, y);
    }
    advance(PARITY_SETTLE);
    return [
      ...host.midi.map(
        (m) => `midi(${m.ch},${m.cmd},${m.p1},${m.p2},${m.mode})`,
      ),
      ...host.hid.map((h) => `hid(${JSON.stringify(h)})`),
    ];
  } finally {
    host.close();
  }
}

/**
 * An entry whose output legitimately depends on how long the contact lasted,
 * so a fast tap and a slow one are NOT supposed to agree.
 *
 * Same rule as the residue allowances: a reason, never a skip, and test 5
 * fails a row whose two lists have stopped differing.
 */
const PARITY_ALLOWANCES: readonly { entry: string; reason: string }[] = [
  {
    entry: "shuttle",
    reason:
      "SHUTTLE is a jog wheel and its output is a function of CONTACT " +
      "DURATION, not of the tap: holding a column runs the transport while " +
      "the finger is down and its Timer emits a keystroke per tick. A " +
      "coalesced press-and-lift has a duration of zero, so `(e==1 or e==4)` " +
      "correctly evaluates the speed to 0 and nothing is sent. That is the " +
      "right answer for a shuttle, and making the two agree would mean " +
      "jogging the transport on a tap nobody held.",
  },
];

/**
 * One compiled PRESET's Lua in a real VM, driven through the same gesture the
 * hand-authored parity probe uses.
 *
 * The construction is `luaRoute` from src/lib/fidelity/lua-parity.spec.ts:
 * compile() the preset's own PadState, feed the emitted Setup and Timer to a
 * LuaHost over a blank, fully "user"-owned PadSim. That is the DEVICE's
 * behaviour - the actual Lua a ZONA would run - and not pad-sim.ts's
 * transcription of the same descriptor.
 */
async function presetParity(id: string, fast: boolean): Promise<Sent> {
  const preset = [...PRESETS].find((p) => p.id === id);
  if (!preset) throw new Error(`no preset ${id}`);
  const built = compile(preset.state);
  const sim = new PadSim(blankPadState());
  const host = await createLuaHost({
    sim,
    setup: built.setupLua,
    timer: built.timerLua.trim() === "" ? undefined : built.timerLua,
  });
  try {
    const at = (f: number): number => Math.round(f * host.coordMax);
    const x = at(PARITY_TAP[0]);
    const y = at(PARITY_TAP[1]);
    const advance = (n: number): void => {
      for (let i = 0; i < n; i += 1) host.tick();
    };
    advance(RESIDUE_WARMUP);
    if (fast) {
      host.touchTap(0, x, y);
      advance(PARITY_HOLD);
    } else {
      host.touchDown(0, x, y);
      advance(PARITY_HOLD);
      host.touchUp(0, x, y);
    }
    advance(PARITY_SETTLE);
    return [
      ...host.midi.map(
        (m) => `midi(${m.ch},${m.cmd},${m.p1},${m.p2},${m.mode})`,
      ),
      ...host.hid.map((h) => `hid(${JSON.stringify(h)})`),
    ];
  } finally {
    host.close();
  }
}

/**
 * A preset whose two runs are NOT required to agree, with the reason.
 *
 * Same rule as PARITY_ALLOWANCES: a reason, never a skip, and the shape is
 * asserted so a row cannot outlive what earned it. Two shapes, because the two
 * situations are not the same thing and collapsing them would let a preset that
 * went silent hide inside a row written for a preset that legitimately differs.
 *
 * `silent`  - the preset sends NOTHING on either run, so the comparison is
 *             vacuous. Asserted as literally empty.
 * `differs` - the preset really does send different things, and that is
 *             correct. Asserted as still differing.
 *
 * TPAD IS NOT HERE, and it was expected to be. See the assertion at the end of
 * the test.
 */
const PRESET_PARITY_ALLOWANCES: readonly {
  preset: string;
  shape: "silent" | "differs";
  reason: string;
}[] = [
  {
    preset: "aurora",
    shape: "silent",
    reason:
      "AURORA's sends.kind is `none`: it is a pure light show and its " +
      "compiled Setup contains no gms at all. No gesture at any point makes " +
      "it send anything, so this row is not excusing a defect, it is saying " +
      "the wire is not where this card lives. Its fast tap IS checked, in " +
      "the picture: the comet paints on every sample including a tap, " +
      "because touchPaint's comet case carries no event guard whatsoever.",
  },
  {
    preset: "starfield",
    shape: "silent",
    reason:
      "STARFIELD's sends.kind is `none`, exactly as AURORA's is, and for the " +
      "same reason: it is a look, not an instrument. Nothing it compiles can " +
      "emit MIDI or HID at any knob position.",
  },
  {
    preset: "pinwheel",
    shape: "silent",
    reason:
      "PINWHEEL's sends.kind is `none`, so the wire half is vacuous - but " +
      "PINWHEEL IS THE PRESET THIS PLAN FIXED. Its defect was in the " +
      "picture: the perFinger trail is wrapped in the compiler's LIVE guard, " +
      "which read `e~=3 and e<5` and is false for the coalesced tap, so a " +
      "fast tap painted no layer record at all where a slow press wrote " +
      "pha 207 / fre 250 / timeout 34. Fixed in plan 11-04 and pinned by " +
      "src/lib/fidelity/preset-baseline.spec.ts, which declares the exact " +
      "emitted substring both before and after.",
  },
  {
    preset: "dial",
    shape: "silent",
    reason:
      "DIAL is a rotary and its output is a function of ANGULAR MOTION, not " +
      "of contact. The emitted handler needs a baseline angle in s.a before " +
      "it can emit a delta, and one sample - fast or slow - cannot produce " +
      "one, so both runs are correctly empty. Same family as SHUTTLE's " +
      "allowance in the hand-authored table above: a gesture with no " +
      "duration and no travel is genuinely nothing to a jog wheel.",
  },
  {
    preset: "ninepads",
    shape: "differs",
    reason:
      "NINEPADS IS A FINDING, NOT A FIX. Measured: a fast tap sends nothing " +
      "where a slow one sends note-on then note-off. The zones emitter " +
      "computes the zone, then `if ENDED then z=nil end` - and code 9 IS an " +
      "end - so the tap resolves to no zone, `o~=z` is false, and neither " +
      "message is sent. Making ENDED false for 9 would send the note-on and " +
      "never the note-off, which is a stuck note: strictly worse. The " +
      "correct behaviour is note-on AND note-off in the SAME callback, which " +
      "needs a change to the emitted SHAPE rather than to an emitted " +
      "constant - and D-02 permits HANGAR to change the vendored compiler's " +
      "constants, not its shape. Left as a BOTOR bug (D-08) and recorded in " +
      "11-04-SUMMARY.md for 11-16.",
  },
];

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

  it("survives the gesture plus two hundred further ticks, and sends something", async () => {
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    const report: string[] = [];
    const runs: SmokeRun[] = [];
    for (const entry of entries) {
      const run = await runFor(entry);
      runs.push(run);
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
      // An entry that emits nothing was not exercised by the gesture. Fix the
      // gesture, never this assertion: a silent instrument is exactly what the
      // gate exists to notice.
      //
      // WHAT COUNTS AS NON-SILENT IS MIDI OR HID. gmms, gmbs and gks are
      // recorded and inert in the browser (lua-host.ts:429), and a
      // configuration whose whole output is keystrokes - a scene switcher, a
      // shuttle, a macro pad - is a keyboard, not a silent instrument. Its
      // output is invisible in HANGAR, and that is a fact about the simulator,
      // stated on the card and auditioned at a bench, rather than a failure of
      // the entry.
      const output = run.midi.length + run.hid.length;
      expect(
        output,
        `${entry.id}: produced no MIDI and no HID at all across ${run.totalTicks} ` +
          "ticks - the scripted gesture never reached anything this configuration sends",
      ).toBeGreaterThan(0);
      report.push(
        `${entry.id}: ${run.midi.length} MIDI, ${run.hid.length} HID, first three MIDI ` +
          run.midi
            .slice(0, 3)
            .map((m) => `(${m.ch},${m.cmd},${m.p1},${m.p2},${m.mode})`)
            .join(" "),
      );
    }

    // THE NON-VACUITY HALF, so widening the question above cannot hide a
    // regression: if the host stopped delivering MIDI altogether, every entry
    // would still "produce output" through some incidental HID call and the
    // gate would go on passing.
    const midiEntries = runs.filter((r) => r.midi.length > 0).map((r) => r.id);
    expect(
      midiEntries.length,
      "no hand-authored configuration produced MIDI at all - the widening above " +
        "would then be hiding a broken host rather than admitting a keyboard",
    ).toBeGreaterThan(0);

    // THE HID SIDE OF THAT GUARANTEE, landed by 09-06 with STAGE and SHUTTLE -
    // the first two configurations in this catalog whose whole output is
    // keystrokes, and therefore the first wave in which this assertion could
    // be true rather than scheduled.
    const hidEntries = runs.filter((r) => r.hid.length > 0).map((r) => r.id);
    expect(
      hidEntries.length,
      "no hand-authored configuration produced HID at all - the widening in 09-02 " +
        "would then be admitting a kind of output the catalog does not actually have",
    ).toBeGreaterThan(0);

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

  it("leaves no cell lit that a never-touched run leaves dark", async () => {
    // THE CLASS-A PROBE (plan 11-02). decay-idiom.spec.ts proves the
    // ARITHMETIC of every glpfs/glt pair it can read; this proves the PICTURE,
    // including the pairs no static scan can resolve and the ones nobody
    // thought to write as a pair at all.
    //
    // The measured symptom it exists to catch: CHORUS left all 81 cells stuck
    // at up to phase 126 of 255 forever, and MORPH left every crossed cell at
    // rgb [47,66,66]. Those are the bench reports "colour stucks after
    // touching it" and "the LED's colors stuck again".
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    const consumed = new Set<string>();
    let compared = 0;

    for (const entry of entries)
      for (const rendering of RESIDUE_RENDERINGS) {
        const [quiet, touched] = await Promise.all([
          residue(entry, false, rendering),
          residue(entry, true, rendering),
        ]);
        expect(
          touched.errors,
          `${entry.id} at ${rendering}: a handler raised during the gesture ` +
            "run - " +
            touched.errors.join(" | "),
        ).toEqual([]);
        expect(
          quiet.samples.length,
          `${entry.id}: both runs took the same number of samples`,
        ).toBe(touched.samples.length);
        // The reset tap has to land on the same LED cell as the first, or it
        // toggles a neighbour instead of undoing the toggle. Derived from the
        // entry's own coordinate maximum, never assumed.
        const span = touched.coordMax + 1;
        for (const divisor of [3, 9]) {
          const first = Math.round(RESIDUE_TAP[0] * touched.coordMax);
          expect(
            Math.floor(((first + 1) * divisor) / span),
            `${entry.id}: the reset tap lands on the same cell as the first at ` +
              `a ${divisor}-wide mapping`,
          ).toBe(Math.floor((first * divisor) / span));
        }

        const allowance = RESIDUE_ALLOWANCES.find(
          (row) => row.entry === entry.id,
        );
        const allowed = new Set(allowance?.cells ?? []);
        const problems: string[] = [];

        for (let cell = 0; cell < CELLS; cell += 1) {
          compared += 1;
          // THE TWO INDEX SPACES, AND THEY ARE NOT THE SAME ONE. `cell` is the
          // SCREEN index the entries themselves write - `glag(0, n)` takes
          // exactly this, and every allowance below is stated in it. The layer
          // records are keyed by HARDWARE index, which is serpentine, and the
          // frame is screen order. Conflating them prints one cell's phase
          // beside another cell's colour, which is how a first cut of this probe
          // reported CONSOLE's fader at column 7 when it had moved column 1.
          const hw = screenToHw(cell % 9, Math.floor(cell / 9));
          // THE PIXEL IS THE QUESTION, AND THE PHASE IS THE DIAGNOSIS. A cell has
          // to be VISIBLY lit in the gesture run and VISIBLY dark in the quiet
          // one at every sample before it is residue at all. SNAKE is the case
          // that made this explicit: it erases its tail with P(k,0,0,0), which
          // writes a BLACK colour at phase 255, so every cell the snake ever
          // vacated is permanently "frozen above zero" and permanently invisible.
          // A phase-only probe reports a game working exactly as designed.
          if (touched.samples.some((s) => !litAt(s.frame, cell))) continue;
          if (quiet.samples.some((s) => litAt(s.frame, cell))) continue;
          const frozen: string[] = [];
          for (const layer of LAYERS) {
            const here = touched.samples.map((s) => s.layers[hw][layer]);
            const there = quiet.samples.map((s) => s.layers[hw][layer]);
            const now = here[0];
            // A SHAPED LAYER IS A KEEPER, NOT A DECAY - the same exclusion
            // src/lib/catalog/decay-idiom.spec.ts section 4 makes, for the same
            // reason: ARC, POMODORO, SHUTTLE and STAGE each run one deliberately
            // and forever, and a gesture is allowed to change what it looks like.
            if (now.sha !== 0) continue;
            if (now.pha === 0) continue;
            // Alive, not residue: something is still driving this layer.
            if (here.some((sample) => sample.pha !== now.pha)) continue;
            // The untouched run must hold it dark at EVERY sample, or the two
            // runs are simply at different points of one animation.
            if (there.some((sample) => sample.pha !== 0)) continue;
            frozen.push(`layer ${layer} at phase ${now.pha}`);
          }
          if (frozen.length === 0) continue;
          if (allowed.has(cell)) {
            consumed.add(entry.id);
            continue;
          }
          problems.push(
            `cell ${cell} (col ${cell % 9}, row ${Math.floor(cell / 9)}, ` +
              `hardware ${hw}): ${frozen.join(" and ")}, where an untouched run ` +
              "holds 0; rendered " +
              rgbAt(quiet.samples[0].frame, cell) +
              " against " +
              rgbAt(touched.samples[0].frame, cell),
          );
        }

        expect(
          problems.join("\n"),
          `${entry.id} at ${rendering}: A GESTURE MUST LEAVE NO CELL LIT THAT A ` +
            "NEVER-TOUCHED RUN LEAVES DARK. Two runs of the same length, one " +
            "double-tapped so a latch is back where it started, and these " +
            `layers are still sitting above phase 0 ${SETTLE_TICKS} ticks after ` +
            "the finger went away and unchanged at every one of " +
            `${RESIDUE_SAMPLE_GAPS.length + 1} samples - so nothing is driving ` +
            "them and nothing is coming back. A decaying layer that does not " +
            "land on phase 0 freezes " +
            "wherever the timeout caught it - see " +
            "src/lib/catalog/decay-idiom.spec.ts. If the state is legitimate, " +
            "add it to RESIDUE_ALLOWANCES with the cells and the reason",
        ).toBe("");
      }

    // The allowance table only ever shrinks: a row that stopped mattering is a
    // standing amnesty for whatever moves into those cells next.
    for (const row of RESIDUE_ALLOWANCES) {
      expect(
        consumed.has(row.entry),
        `RESIDUE_ALLOWANCES excuses ${row.entry} and nothing in it needed ` +
          "excusing. Delete the row",
      ).toBe(true);
      expect(
        row.reason.trim().length,
        `RESIDUE_ALLOWANCES row ${row.entry} carries no usable reason`,
      ).toBeGreaterThan(40);
    }
    expect(compared, "the probe compared cells").toBe(
      CELLS * entries.length * RESIDUE_RENDERINGS.length,
    );
  }, 120000);

  it("sends the same on a fast tap as on a slow one", async () => {
    // THE CLASS-B PROBE (plan 11-02). Firmware coalesces a sub-cycle
    // press-and-lift into ONE message with event code 9, and touchTap is the
    // only path in the simulator that makes one. Five entries read that as a
    // plain lift and produced NOTHING: measured in 11-RESEARCH, LATTICE sent 0
    // messages on a fast tap against 2 on a slow one, CHORUS 0 against 6,
    // MORPH 0 against 4 and GHOST 0 against 8.
    //
    // THE LISTS ARE COMPARED, NOT THEIR LENGTHS. A note-off arriving without
    // its note-on is the same count and a different instrument.
    const entries = luaEntries();
    expect(entries.length, "there are hand-authored entries").toBeGreaterThan(
      0,
    );
    const consumed = new Set<string>();
    const report: string[] = [];

    for (const entry of entries) {
      const [fast, slow] = await Promise.all([
        parity(entry, true),
        parity(entry, false),
      ]);
      report.push(
        `${entry.id}: fast tap ${fast.length}, slow tap ${slow.length}`,
      );
      // NON-VACUITY, PER ENTRY. Two empty lists are equal, so an entry the tap
      // never reaches passes this test having proved nothing - which is exactly
      // what CONSOLE and QUADRANT did at the probe's first tap point. The slow
      // run is the reference and it must have produced something.
      expect(
        slow.length,
        `${entry.id}: the slow tap at (${PARITY_TAP[0]}, ${PARITY_TAP[1]}) ` +
          "produced no MIDI and no HID, so comparing the two runs proves " +
          "nothing. Move PARITY_TAP, do not weaken this",
      ).toBeGreaterThan(0);
      const allowance = PARITY_ALLOWANCES.find((row) => row.entry === entry.id);
      if (typeof allowance !== "undefined") {
        consumed.add(entry.id);
        expect(
          fast.join("\n") === slow.join("\n"),
          `PARITY_ALLOWANCES excuses ${entry.id} and its two runs now agree. ` +
            "Delete the row",
        ).toBe(false);
        continue;
      }
      expect(
        fast,
        `${entry.id}: A FAST TAP MUST SEND WHAT A SLOW TAP SENDS. Event code ` +
          "9 is a down AND an up in one message; a guard that reads it as " +
          "only a lift throws the press away and the configuration goes " +
          `silent. fast tap sent ${fast.length} message(s):\n  ` +
          (fast.join("\n  ") || "(nothing)") +
          `\nslow tap sent ${slow.length}:\n  ` +
          (slow.join("\n  ") || "(nothing)") +
          "\nIf the difference is legitimate, add it to PARITY_ALLOWANCES " +
          "with the reason - see src/lib/catalog/touch-guard.spec.ts",
      ).toEqual(slow);
    }

    for (const row of PARITY_ALLOWANCES) {
      expect(
        consumed.has(row.entry),
        `PARITY_ALLOWANCES names ${row.entry}, which is not in the catalog`,
      ).toBe(true);
      expect(
        row.reason.trim().length,
        `PARITY_ALLOWANCES row ${row.entry} carries no usable reason`,
      ).toBeGreaterThan(40);
    }

    // Report first, assert second - the sibling sweeps' idiom. These are the
    // numbers plan 11-02 is judged on, printed rather than inferred from a
    // green run.
    process.stdout.write(
      "\nfast tap against slow tap, per entry:\n  " +
        report.join("\n  ") +
        "\n",
    );
    expect(report.length, "the probe ran every entry").toBe(entries.length);
  }, 120000);

  it("sends the same on a fast tap as on a slow one, on the nine COMPILED presets", async () => {
    // THE CLASS-B PROBE, POINTED AT THE OTHER HALF OF THE CATALOG (plan
    // 11-04). The test above asks this of the eighteen hand-authored Lua
    // entries, whose guards a human wrote. This one asks it of the nine
    // presets, whose guards the VENDORED COMPILER writes - and nobody had
    // ever looked. The research counted fast-tap MIDI for all twenty-seven
    // Lua entries and for none of these.
    //
    // The Lua under test is compile(preset.state).setupLua, run in the same
    // real VM over the same blank PadSim the parity gate in
    // src/lib/fidelity/lua-parity.spec.ts uses. So this measures what the
    // DEVICE would do, not what pad-sim.ts's transcription would do - which
    // is the point: a fast tap that the compiler throws away is thrown away
    // on hardware.
    //
    // What it found, before plan 11-04 changed anything: RADAR sent 0
    // messages on a fast tap against 2 on a slow one, JOYSTICK 2 against 4,
    // FADERS 0 against 1 and NINEPADS 0 against 2. Two guards were
    // responsible - phaseCond's held arm and LIVE - and both are now fixed
    // in the vendored compiler under upstream-manifest.json.
    const presets = [...PRESETS];
    expect(presets.length, "the nine compiler-driven presets").toBe(9);
    const report: string[] = [];
    const consumed = new Set<string>();

    for (const preset of presets) {
      const [fast, slow] = await Promise.all([
        presetParity(preset.id, true),
        presetParity(preset.id, false),
      ]);
      report.push(
        `${preset.id}: fast tap ${fast.length}, slow tap ${slow.length}`,
      );
      const allowance = PRESET_PARITY_ALLOWANCES.find(
        (row) => row.preset === preset.id,
      );
      if (typeof allowance !== "undefined") {
        consumed.add(preset.id);
        // An allowance has to keep EARNING itself. A silent one is a preset
        // nobody is checking; each shape below is asserted, so the day the
        // reason stops being true the row goes red instead of going quiet.
        if (allowance.shape === "silent") {
          expect(
            [...fast, ...slow],
            `PRESET_PARITY_ALLOWANCES excuses ${preset.id} as sending nothing ` +
              "on either run, and it now sends something. Delete the row and " +
              "let the comparison below do its job",
          ).toEqual([]);
        } else {
          expect(
            fast.join("\n") === slow.join("\n"),
            `PRESET_PARITY_ALLOWANCES excuses ${preset.id} as differing, and ` +
              "its two runs now agree. Delete the row",
          ).toBe(false);
        }
        continue;
      }
      // NON-VACUITY, PER PRESET, exactly as the test above does it: two
      // empty lists are equal, so a preset the tap never reaches would pass
      // having proved nothing. Four of the nine genuinely send nothing and
      // they are DECLARED above rather than counted here.
      expect(
        slow.length,
        `${preset.id}: the slow tap at (${PARITY_TAP[0]}, ${PARITY_TAP[1]}) ` +
          "produced no MIDI and no HID, so comparing the two runs proves " +
          "nothing. Declare it in PRESET_PARITY_ALLOWANCES with a reason, or " +
          "move PARITY_TAP - do not weaken this",
      ).toBeGreaterThan(0);
      expect(
        fast,
        `${preset.id}: A FAST TAP MUST SEND WHAT A SLOW TAP SENDS, and this ` +
          "is the COMPILER's guard, not a hand-written one. Event code 9 is " +
          "a down AND an up in one message; phaseCond's held arm and LIVE " +
          "both have to admit it. fast tap sent " +
          `${fast.length} message(s):\n  ` +
          (fast.join("\n  ") || "(nothing)") +
          `\nslow tap sent ${slow.length}:\n  ` +
          (slow.join("\n  ") || "(nothing)") +
          "\nIf the difference is legitimate, add it to " +
          "PRESET_PARITY_ALLOWANCES with the reason - and if the fix belongs " +
          "in the vendored compiler, it also needs a row in " +
          "src/lib/fidelity/upstream-manifest.json (D-02)",
      ).toEqual(slow);
    }

    for (const row of PRESET_PARITY_ALLOWANCES) {
      expect(
        consumed.has(row.preset),
        `PRESET_PARITY_ALLOWANCES names ${row.preset}, which is not a preset`,
      ).toBe(true);
      expect(
        row.reason.trim().length,
        `PRESET_PARITY_ALLOWANCES row ${row.preset} carries no usable reason`,
      ).toBeGreaterThan(40);
    }

    // TPAD IS NOT IN THE ALLOWANCE TABLE AND THAT IS THE STRONGEST LINE HERE.
    // Plan 11-04 was written expecting to excuse it. Measured, it AGREES on
    // both runs with no row at all, because it routes code 9 through its own
    // onset branch. The negative check that proved the point is in
    // 11-04-SUMMARY.md: forcing the naive `e>=5 and e<9` fix onto its guard
    // took it from 6/6 agreeing to 2/6 differing - a contact that starts and
    // never ends - and put its Setup at 910 of 908 at the same time.
    expect(
      PRESET_PARITY_ALLOWANCES.some((row) => row.preset === "tpad"),
      "tpad must NOT be excused here: it agrees on both runs, and an " +
        "allowance for a preset that needs none is a standing amnesty",
    ).toBe(false);

    process.stdout.write(
      "\nfast tap against slow tap, per COMPILED preset:\n  " +
        report.join("\n  ") +
        "\n",
    );
    expect(report.length, "the probe ran every preset").toBe(presets.length);
  }, 120000);
});
