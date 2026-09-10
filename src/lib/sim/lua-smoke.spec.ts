// The execution gate: every hand-authored configuration actually RUNS.
//
// Thirteen tests, and the count never moves WITH THE CATALOG - each loops over
// the Lua entries internally and names the entry in its message, so waves 5 and
// 6 add configurations without touching a number here. A test that pins ONE
// entry's answer to ONE bench note is the exception the last four plans have
// each spent once, and it is named in its own title. The budget, canonical form and
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
  // EMPTY SINCE PLAN 11-12, AND THE ROW THAT LEFT IT IS A RESULT RATHER THAN A
  // TIDY-UP. It excused SHUTTLE, whose hold-to-scrub gesture read
  // "(e==1 or e==4)" and therefore evaluated a coalesced press-and-lift to a
  // speed of ZERO - a fast tap on that card sent nothing at all, and the row
  // said so in as many words. The rewrite sets the speed on a press, a move and
  // a tap alike and then LATCHES it, so the transport's output no longer
  // depends on how long the contact lasted and the two runs emit the same
  // keystrokes in the same order. Test 5 fails any row whose two lists have
  // stopped differing, so the row could not be kept as a comment on history.
  //
  // MEASURED, NOT ASSUMED, AND THE CONDITION IS WORTH KNOWING: the slow run
  // holds for PARITY_HOLD = 6 ticks longer than the fast one, and at the
  // entry's defaults the Timer's period at the probe's column is
  // 300//(1+3) = 75 ms = 7.5 ticks. Six ticks is less than one period, so the
  // extra hold does not buy an extra keystroke. A default period short enough
  // to fire twice inside six ticks would make the two runs differ again - by a
  // count, not by a defect - and this is the sentence that says so.
  //
  // The type and the table stay for the reason KNOWN_VIOLATIONS stays empty in
  // decay-idiom.spec.ts: a mechanism deleted the day it empties is a mechanism
  // the next author has to reinvent.
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

// ---------------------------------------------------------------------------
// THE SWEEP HELPERS (plan 11-07)
//
// Everything below drives ONE named entry rather than the catalog, which is
// why it sits apart from the walks above: a value sweep is a question about a
// particular piece of arithmetic and there is nothing uniform to ask.
//
// EVERY COORDINATE IS DERIVED FROM THE ENTRY'S OWN DIVISION, never pasted. All
// three cards read a cell as t*9//128, so the centre of cell k is
// (k*128 + 64)//9, and a probe that hard-coded pixels would silently drift the
// day a card unlocked the 10-bit range.
// ---------------------------------------------------------------------------

/** The centre of cell index k on one axis, for a nine-wide t*9//128 mapping. */
function cellCentre(k: number): number {
  return Math.floor((k * 128 + 64) / 9);
}

function entryById(id: string): CatalogEntry {
  const found = CATALOG.find((candidate) => candidate.id === id);
  if (typeof found === "undefined")
    throw new Error(`${id} is not in the catalog`);
  return found;
}

const consoleEntry = (): CatalogEntry => entryById("console");

/** A knob's SELECTED value, as a number. Derived, never restated. */
function knobValueOf(entry: CatalogEntry, knobId: string): number {
  const knob = entry.knobs.find((candidate) => candidate.id === knobId);
  if (typeof knob === "undefined")
    throw new Error(`${entry.id} has no knob "${knobId}"`);
  const index = entry.defaults[knob.id] ?? knob.default;
  return Number.parseInt(knob.values[index], 10);
}

/** Press cell (column, row) and lift again, two ticks apart. */
function tapConsoleCell(
  host: { touchDown: TouchFn; touchUp: TouchFn; tick: () => void },
  column: number,
  row: number,
): void {
  const x = cellCentre(column);
  const y = cellCentre(row);
  host.touchDown(0, x, y);
  host.tick();
  host.touchUp(0, x, y);
  host.tick();
}

type TouchFn = (id: number, x: number, y: number) => void;

/**
 * Drag a finger up the eight body cells of one column, bottom to top, and
 * return the delivered sample count.
 *
 * Rows 8 down to 1: row 0 is the mute cap and is deliberately never crossed,
 * so this measures the FADER and nothing else.
 */
function sweepConsoleBody(
  host: {
    touchDown: TouchFn;
    touchMove: TouchFn;
    touchUp: TouchFn;
    tick: () => void;
  },
  column: number,
): number[] {
  const x = cellCentre(column);
  const rows: number[] = [];
  host.touchDown(0, x, cellCentre(8));
  host.tick();
  rows.push(8);
  for (let row = 7; row >= 1; row -= 1) {
    host.touchMove(0, x, cellCentre(row));
    host.tick();
    rows.push(row);
  }
  host.touchUp(0, x, cellCentre(1));
  host.tick();
  return rows;
}

/** Every raw coordinate that lands in cell k under a nine-wide t*9//128 map. */
function coordinatesIn(k: number): number[] {
  const out: number[] = [];
  for (let t = 0; t <= 127; t += 1)
    if (Math.floor((t * 9) / 128) === k) out.push(t);
  return out;
}

/**
 * Drag one contact across the whole mute row, left to right, one raw
 * coordinate per tick. Returns the number of samples delivered.
 */
function swipeConsoleMuteRow(host: {
  touchDown: TouchFn;
  touchMove: TouchFn;
  touchUp: TouchFn;
  tick: () => void;
}): number {
  const y = cellCentre(0);
  host.touchDown(0, 0, y);
  host.tick();
  let delivered = 1;
  for (let x = 1; x <= 127; x += 1) {
    host.touchMove(0, x, y);
    host.tick();
    delivered += 1;
  }
  host.touchUp(0, 127, y);
  host.tick();
  return delivered;
}

/**
 * Hold one contact inside a single mute cell, wobbling over every raw
 * coordinate the cell contains. Returns the number of samples delivered.
 */
function restConsoleMuteCell(
  host: {
    touchDown: TouchFn;
    touchMove: TouchFn;
    touchUp: TouchFn;
    tick: () => void;
  },
  column: number,
): number {
  const xs = coordinatesIn(column);
  const ys = coordinatesIn(0);
  host.touchDown(0, xs[0], ys[0]);
  host.tick();
  let delivered = 1;
  for (const y of ys)
    for (const x of xs) {
      if (x === xs[0] && y === ys[0]) continue;
      host.touchMove(0, x, y);
      host.tick();
      delivered += 1;
    }
  host.touchUp(0, xs[xs.length - 1], ys[ys.length - 1]);
  host.tick();
  return delivered;
}

/**
 * FORGE's macro index inside its `gks` call, and it is CHECKED, not counted on.
 *
 * The call is gks(10, 1,1,@MOD, 1,1,m, 0,2,@KEY0+n, 1,0,m, 1,0,@MOD): a leading
 * delay then five three-argument tuples, sixteen arguments in all. The keycode
 * is the third member of the third tuple, so index 9. Firmware rejects the call
 * unless (nargs - 1) % 3 == 0 and A REJECTED gks IS SILENT, so the sweep below
 * asserts the arity before it reads anything off the position.
 */
const FORGE_GKS_ARITY = 16;
const FORGE_KEY_ARG = 9;

/** The marker for "this press sent nothing at all". */
const NO_SEND = -1;

/**
 * Press every raw coordinate on the pad once and record what FORGE sent.
 *
 * A PRESS AND A LIFT PER POINT, 16,384 of them, because FORGE is onset-gated:
 * a drag would report one macro for a whole stroke, which is the very thing the
 * slide probe below measures on purpose.
 */
async function sweepForge(entry: CatalogEntry): Promise<{
  area: Map<number, number>;
  columnFirstX: Map<number, number>;
  bandFirstY: Map<number, number>;
  arity: number;
  slidAcrossColumns: number[];
  slidAcrossBands: number[];
  cornerTap: number;
}> {
  const { host } = await open(entry);
  try {
    let arity = 0;
    const press = (x: number, y: number): number => {
      const before = host.hid.length;
      host.touchDown(0, x, y);
      host.tick();
      host.touchUp(0, x, y);
      host.tick();
      const sent = host.hid.slice(before);
      if (sent.length === 0) return NO_SEND;
      arity = Math.max(arity, sent[0].args.length);
      return sent[0].args[FORGE_KEY_ARG];
    };

    const area = new Map<number, number>();
    for (let y = 0; y <= 127; y += 1)
      for (let x = 0; x <= 127; x += 1) {
        const key = press(x, y);
        area.set(key, (area.get(key) ?? 0) + 1);
      }

    // The boundaries, read off two one-dimensional passes rather than derived.
    const columnFirstX = new Map<number, number>();
    let previous = NaN;
    for (let x = 0; x <= 127; x += 1) {
      const key = press(x, 20);
      if (key !== previous) columnFirstX.set(key, x);
      previous = key;
    }
    const bandFirstY = new Map<number, number>();
    previous = NaN;
    for (let y = 0; y <= 127; y += 1) {
      const key = press(64, y);
      if (key !== previous) bandFirstY.set(key, y);
      previous = key;
    }

    // A press that lands one target off and slides to the intended one.
    const slide = (
      from: readonly [number, number],
      to: readonly [number, number],
    ): number[] => {
      const before = host.hid.length;
      host.touchDown(0, from[0], from[1]);
      host.tick();
      const steps = Math.max(
        Math.abs(to[0] - from[0]),
        Math.abs(to[1] - from[1]),
      );
      for (let i = 1; i <= steps; i += 1) {
        host.touchMove(
          0,
          from[0] + Math.round(((to[0] - from[0]) * i) / steps),
          from[1] + Math.round(((to[1] - from[1]) * i) / steps),
        );
        host.tick();
      }
      host.touchUp(0, to[0], to[1]);
      host.tick();
      return host.hid.slice(before).map((h) => h.args[FORGE_KEY_ARG]);
    };
    const slidAcrossColumns = slide([10, 20], [40, 20]);
    const slidAcrossBands = slide([64, 40], [64, 90]);

    const beforeTap = host.hid.length;
    host.touchTap(0, 127, 127);
    host.tick();
    host.tick();
    const cornerTap = host.hid.length - beforeTap;

    return {
      area,
      columnFirstX,
      bandFirstY,
      arity,
      slidAcrossColumns,
      slidAcrossBands,
      cornerTap,
    };
  } finally {
    host.close();
  }
}

/** Press every raw coordinate once and record every note LATTICE sounded. */
async function sweepLattice(
  entry: CatalogEntry,
): Promise<{ area: Map<number, number>; cells: number }> {
  const { host } = await open(entry);
  try {
    const area = new Map<number, number>();
    let cells = 0;
    for (let y = 0; y <= 127; y += 1)
      for (let x = 0; x <= 127; x += 1) {
        const before = host.midi.length;
        host.touchDown(0, x, y);
        host.tick();
        host.touchUp(0, x, y);
        host.tick();
        const notes = host.midi
          .slice(before)
          .filter((m) => m.cmd === 144)
          .map((m) => m.p1);
        if (notes.length > 0) cells += 1;
        for (const note of notes) area.set(note, (area.get(note) ?? 0) + 1);
      }
    return { area, cells };
  } finally {
    host.close();
  }
}

/** The controller values one column emits over its whole travel. */
async function sweepConsoleColumn(
  entry: CatalogEntry,
  column: number,
): Promise<number[]> {
  const { host } = await open(entry);
  try {
    const controller = knobValueOf(entry, "cc") + column;
    sweepConsoleBody(host, column);
    return host.midi
      .filter((m) => m.cmd === 176 && m.p1 === controller)
      .map((m) => m.p2);
  } finally {
    host.close();
  }
}

// ---------------------------------------------------------------------------
// THE SWIPE FAMILY (plan 11-08)
//
// EUCLID, SONAR and STEPS all toggle a cell, and all three used to filter every
// MOVE out at the first line of the touch callback - so a finger drawn across
// the pad changed the cell it landed on and nothing else. Measured, before the
// fix: a 128-sample swipe along row 4 changed 0 cells on EUCLID (its landing
// cell is not on a ring) and exactly 1 on SONAR and STEPS.
//
// Accepting MOVE alone would have been worse than the complaint: a MOVE arrives
// every 10 ms, so a finger resting inside one cell would toggle it at 100 Hz.
// The per-contact last-cell guard is what makes a drag survivable, and this
// test measures all three halves of it.
//
// THE OBSERVABLE IS THE ARM LAYER'S PHASE, NOT THE FRAME. All three entries
// animate from a Timer, so a frame diff over a 130-tick gesture would be mostly
// the Timer's own work. Each entry paints its armed state on a layer its Timer
// never writes - EUCLID and SONAR on layer 1, STEPS on layer 2 - so the phase
// of that layer is exactly "is this cell armed", independent of the tick.
// ---------------------------------------------------------------------------

type SwipeEntry = {
  readonly id: string;
  /** The layer the entry paints ARMED state on. Its Timer writes the other. */
  readonly armLayer: 0 | 1 | 2;
  /**
   * Does a touch on this screen cell change anything at all?
   *
   * DERIVED FROM THE ENTRY'S OWN RULE, restated here in one line each with the
   * source it comes from, because the alternative - asserting a bare count - is
   * the count-only assertion 11-07 caught passing green on a real off-by-one.
   */
  readonly eligible: (cell: number) => boolean;
  readonly why: string;
};

/** Chebyshev distance from the centre cell (4,4). EUCLID's ring number. */
function ringOf(cell: number): number {
  return Math.max(Math.abs((cell % 9) - 4), Math.abs(Math.floor(cell / 9) - 4));
}

const SWIPE_ENTRIES: readonly SwipeEntry[] = [
  {
    id: "euclid",
    armLayer: 1,
    eligible: (cell) => ringOf(cell) >= 1 && ringOf(cell) <= 3,
    why:
      "EUCLID's rings are the three concentric squares at Chebyshev distance " +
      "1, 2 and 3; the centre and the outermost square carry no step, and its " +
      "Setup leaves self.i nil for both",
  },
  {
    id: "sonar",
    armLayer: 1,
    eligible: () => true,
    why: "SONAR arms any of the 81 cells - ring is pitch, angle is time",
  },
  {
    id: "steps",
    armLayer: 2,
    eligible: (cell) => cell % 9 <= 7 && Math.floor(cell / 9) <= 7,
    why:
      "STEPS is eight by eight inside a nine by nine pad and its callback " +
      "returns for c > 7 or r > 7",
  },
];

/** The hardware index of a screen cell, for the raw layer reads below. */
function hwOfCell(cell: number): number {
  return screenToHw(cell % 9, Math.floor(cell / 9));
}

/** One phase per screen cell on one layer - the armed picture, as a vector. */
function armVector(sim: PadSim, layer: 0 | 1 | 2): number[] {
  const out: number[] = [];
  for (let cell = 0; cell < 81; cell += 1)
    out.push(sim.layer(hwOfCell(cell), layer).pha);
  return out;
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

  // -------------------------------------------------------------------------
  // THE VALUE SWEEPS (plan 11-07)
  //
  // The probes above ask whether an entry SENDS. These ask WHAT it sends,
  // across the whole travel of a control, and they exist because CONSOLE's
  // bench complaint - "clamp issue in the top row because its not precise" -
  // sounded like an event-handling fault and was an arithmetic ceiling:
  // h*127//8 over a reachable h of 0..7 tops out at 111 of 127, and the only
  // way to see that is to drive the control and read the numbers off the wire.
  //
  // EACH ASSERTS A COUNT AND AN ENDPOINT, NEVER THE WHOLE LIST. A list
  // assertion goes red on any future re-scaling for no reason; a count plus an
  // endpoint goes red exactly when the arithmetic stops reaching the end of its
  // range, which is the defect these were written from.
  // -------------------------------------------------------------------------

  it("drives a CONSOLE column across its whole travel and reaches 127", async () => {
    const entry = consoleEntry();
    // Derived from the entry's own knob rather than pasted: the controller a
    // column sends is @CC + c, and @CC is whatever the card ships as default.
    const cc = knobValueOf(entry, "cc");
    const report: string[] = [];
    let observed: number[] = [];

    for (let column = 0; column < 9; column += 1) {
      const values = await sweepConsoleColumn(entry, column);
      report.push(`column ${column} (cc ${cc + column}): ${values.join(", ")}`);
      if (column === 4) observed = values;
      const distinct = new Set(values);
      expect(
        values.length,
        `console column ${column}: the sweep sent nothing at all, so nothing ` +
          "below proves anything",
      ).toBeGreaterThan(0);
      expect(
        distinct,
        `console column ${column}: A FADER MUST REACH THE TOP OF ITS RANGE. ` +
          "The body of a column is rows 1..8, so h = 8-r runs 0..7 and the " +
          "scale factor has to be 127//7. It was 127//8, whose maximum over " +
          "that h is 7*127//8 = 111, so every strip stopped an eighth short " +
          `of full scale at every position. Observed: ${values.join(", ")}`,
      ).toContain(127);
      expect(
        distinct.size,
        `console column ${column}: eight body cells are eight levels, and a ` +
          "sweep down the column must produce all eight. Observed " +
          `${[...distinct].join(", ")}`,
      ).toBe(8);
    }

    process.stdout.write(
      "\nCONSOLE column sweep, one value per body cell:\n  " +
        report.join("\n  ") +
        "\n",
    );
    // The zero end is asserted too, so the range is pinned at BOTH ends and a
    // rescaling that lifted the floor off 0 would be caught as readily as one
    // that dropped the ceiling.
    expect(observed, "the sweep reached column 4").toContain(0);
  }, 120000);

  it("leaves a muted CONSOLE column inert, and gives it back from the mute cap", async () => {
    const entry = consoleEntry();
    const cc = knobValueOf(entry, "cc");
    const column = 3;
    const controller = cc + column;
    const { host } = await open(entry);
    const report: string[] = [];
    try {
      const on = (n: number): number[] =>
        host.midi
          .slice(n)
          .filter((m) => m.cmd === 176 && m.p1 === controller)
          .map((m) => m.p2);

      // 1. The mute cap, tapped. Setup left every strip at level 4, so this
      //    sends a 0 and remembers the 4.
      let mark = host.midi.length;
      tapConsoleCell(host, column, 0);
      const muted = on(mark);
      report.push(`mute cap tapped: ${muted.join(", ") || "(nothing)"}`);
      expect(
        muted,
        "console: tapping the mute cap must send the column's controller at 0",
      ).toEqual([0]);

      // 2. The whole fader body, swept, while the column is muted.
      mark = host.midi.length;
      const whileMuted = sweepConsoleBody(host, column);
      report.push(
        `swept while muted: ${whileMuted.length} sample(s) delivered, ` +
          `${on(mark).length} message(s)`,
      );
      expect(
        whileMuted.length,
        "console: the muted sweep delivered no touch samples at all, so its " +
          "silence proves nothing. Fix the gesture, not the assertion",
      ).toBeGreaterThan(0);
      expect(
        on(mark),
        "console: A MUTED FADER MUST DO NOTHING. The bench asked that a muted " +
          "strip stop responding to touch, which REVERSES the shipped " +
          "`s.m[c]=nil` - a fader you touch is a fader you want. The body is " +
          "gated on `and not s.m[c]`; if that gate goes, this sweep sends " +
          "eight messages and silently clears the mute half way through",
      ).toEqual([]);

      // 3. The mute cap again. It must give back the REMEMBERED level, which
      //    is still 4 - proving step 2 stored nothing as well as sent nothing.
      mark = host.midi.length;
      tapConsoleCell(host, column, 0);
      const restored = on(mark);
      report.push(`mute cap tapped again: ${restored.join(", ")}`);
      expect(
        restored,
        "console: unmuting must re-send the level the strip was muted at. " +
          "Setup leaves every strip at h = 4, which is 4*127//7 = 72. A " +
          "different number here means the muted sweep wrote self.v[c] even " +
          "though it sent nothing",
      ).toEqual([Math.floor((4 * 127) / 7)]);

      // 4. And the fader answers again, so the mute is undoable rather than a
      //    one-way door. This half is the whole reason the cap is the only
      //    remaining unmute path: a mute you cannot clear is worse than the
      //    complaint.
      mark = host.midi.length;
      sweepConsoleBody(host, column);
      const after = on(mark);
      report.push(`swept after unmuting: ${after.join(", ")}`);
      expect(
        after,
        "console: after unmuting from the cap the fader must respond again",
      ).toContain(127);

      // 5. THE SWIPE (plan 11-07). A finger dragged across the mute row must
      //    change every column it crosses, and change each of them EXACTLY
      //    once. Both halves matter: nine is the bench's ask, and "exactly
      //    once" is the guard.
      mark = host.midi.length;
      const delivered = swipeConsoleMuteRow(host);
      const perColumn = new Map<number, number>();
      for (const message of host.midi.slice(mark)) {
        if (message.cmd !== 176) continue;
        const c = message.p1 - cc;
        perColumn.set(c, (perColumn.get(c) ?? 0) + 1);
      }
      const counts = [...perColumn.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([c, n]) => `${c}:${n}`);
      report.push(
        `swiped across the mute row: ${delivered} sample(s) delivered, ` +
          `changes per column ${counts.join(" ")}`,
      );
      expect(
        delivered,
        "console: the mute-row swipe delivered no samples, so its counts " +
          "prove nothing",
      ).toBeGreaterThan(9);
      expect(
        counts,
        "console: A SWIPE ACROSS THE MUTE ROW MUST CHANGE EACH CROSSED COLUMN " +
          "EXACTLY ONCE. All nine, because the row spans the pad; once each, " +
          "because self.q[i] remembers the last mute cell this contact " +
          "toggled and the branch reads `e==4 or e>8 or s.q[i]~=c`",
      ).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => `${c}:1`));

      // 6. THE RESTING FINGER, and this is the whole reason the guard exists.
      //    A contact that never leaves one mute cell must change it once, not
      //    once per sample. Every sample below is a DIFFERENT coordinate
      //    inside the same cell, because the host's enqueue is change-gated on
      //    (event, x, y) per contact - a probe that re-sent one point would be
      //    measuring the host's dedup and calling it the entry's.
      mark = host.midi.length;
      const resting = restConsoleMuteCell(host, 6);
      const restChanges = host.midi
        .slice(mark)
        .filter((m) => m.cmd === 176 && m.p1 === cc + 6).length;
      report.push(
        `rested inside mute cell 6: ${resting} sample(s) delivered, ` +
          `${restChanges} change(s)`,
      );
      expect(
        resting,
        "console: the resting probe delivered too few samples to tell a " +
          "guarded branch from an unguarded one",
      ).toBeGreaterThan(100);
      expect(
        restChanges,
        `console: A FINGER RESTING IN ONE MUTE CELL MUST CHANGE IT ONCE. ` +
          `${resting} samples arrived; without the self.q[i] guard the mute ` +
          "toggles on every one of them, which at the firmware's rate is a " +
          "strip flickering at 100 Hz under a still finger. That is why the " +
          "mute row was onset-gated before this plan, and the guard is what " +
          "buys the swipe without buying the flicker",
      ).toBe(1);
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nCONSOLE mute behaviour, column 3 then the row:\n  " +
        report.join("\n  ") +
        "\n",
    );
    expect(report.length, "every stage of the mute probe ran").toBe(6);
  }, 120000);

  it("reaches every one of FORGE's twenty-seven macros, at both ends", async () => {
    // MEASURED AND CLEAN, and this test is what makes that a fact rather than
    // a claim (plan 11-07). FORGE's bench note - "waay not precise enough" -
    // had reached no plan, no removal and no deferral, so its whole travel was
    // swept the way CONSOLE's column was. Nothing was found in the target map:
    // all twenty-seven macro indices are reachable, both endpoints included.
    //
    // THE TWO THINGS THE SWEEP DID FIND ARE GEOMETRY, NOT ARITHMETIC, and both
    // are asserted below so they cannot drift while nobody is looking: macro 26
    // is smaller than every other target because the bank corner takes a third
    // of it, and a press is FINAL because the handler is onset-gated. Neither
    // is fixed here. Firing on MOVE would spray keystrokes off a macro pad,
    // which is strictly worse than the complaint, so what to do about the
    // press-is-final gesture is a bench question - see 11-07-SUMMARY.md.
    const entry = entryById("forge");
    const key0 = knobValueOf(entry, "key");
    const swept = await sweepForge(entry);
    const reachable = [...swept.area.keys()]
      .filter((k) => k !== NO_SEND)
      .sort((a, b) => a - b);
    const report: string[] = [];

    expect(
      swept.arity,
      "forge: A REJECTED gks IS SILENT. The call must carry a leading delay " +
        "plus five three-argument tuples, and (nargs - 1) % 3 must be 0, or " +
        "nothing below is reading a keycode at all",
    ).toBe(FORGE_GKS_ARITY);
    expect((swept.arity - 1) % 3, "forge: the gks arity rule").toBe(0);

    report.push(`reachable macro indices: ${reachable.join(", ")}`);
    expect(
      reachable.length,
      "forge: THE CARD CLAIMS TWENTY-SEVEN MACROS AND MUST REACH ALL OF THEM. " +
        `Swept every one of the 16,384 raw coordinates; ${reachable.length} ` +
        `distinct keycodes came back: ${reachable.join(", ")}`,
    ).toBe(27);
    expect(
      reachable[0],
      "forge: the first macro is @KEY0 itself, at the top-left target",
    ).toBe(key0);
    expect(
      reachable[reachable.length - 1],
      "forge: the last macro is @KEY0 + 26, at the bottom-right of band 2. " +
        "An index past it has run off the end of the twenty-seven contiguous " +
        "usage ids the header writes out, and a wrong usage id is a card that " +
        "presses the wrong key on somebody's machine",
    ).toBe(key0 + 26);
    for (const index of reachable)
      expect(
        index >= key0 && index <= key0 + 26,
        `forge: keycode ${index} is outside @KEY0..@KEY0+26 (${key0}..${key0 + 26})`,
      ).toBe(true);

    // The boundaries and the target sizes, in raw coordinate units.
    const columns = [...swept.columnFirstX.values()].sort((a, b) => a - b);
    const bands = [...swept.bandFirstY.values()].sort((a, b) => a - b);
    report.push(`column boundaries (raw x): ${columns.join(", ")}`);
    report.push(`band boundaries (raw y): ${bands.join(", ")}`);
    report.push(
      "target areas (raw units): " +
        reachable.map((k) => `${k}:${swept.area.get(k)}`).join(" "),
    );
    expect(columns.length, "forge: nine columns").toBe(9);
    expect(bands.length, "forge: three bands").toBe(3);

    // Macro 26 loses its bottom row to the bank corner, so its target is two
    // thirds of its band-mates'. A FACT, recorded, not a defect being fixed.
    const last = swept.area.get(key0 + 26) ?? 0;
    const others = reachable
      .filter((k) => k !== key0 + 26)
      .map((k) => swept.area.get(k) ?? 0);
    report.push(
      `macro 26 area ${last} against a smallest other of ${Math.min(...others)} ` +
        `and a largest of ${Math.max(...others)}; the bank corner itself is ` +
        `${swept.area.get(NO_SEND)} raw units that send nothing`,
    );
    expect(
      last < Math.min(...others),
      "forge: macro 26 sits in the same column as the bank corner and cell 80 " +
        "returns before the send, so its target is smaller than every other " +
        "macro's. If that stops being true the corner has moved and the " +
        "header's bank argument needs re-reading",
    ).toBe(true);
    expect(
      swept.area.get(NO_SEND),
      "forge: the bank corner is one cell of the nine-wide mapping and sends " +
        "no keystroke at all",
    ).toBe(14 * 14);

    // THE PRESS IS FINAL. Land one target off, slide to the intended one, and
    // the pad has already sent the wrong macro.
    report.push(
      `slid across a column boundary: ${swept.slidAcrossColumns.join(", ") || "(nothing)"}`,
    );
    report.push(
      `slid across a band boundary: ${swept.slidAcrossBands.join(", ") || "(nothing)"}`,
    );
    report.push(`fast tap on the bank corner: ${swept.cornerTap} keystroke(s)`);
    expect(
      swept.slidAcrossColumns,
      "forge: A PRESS IS FINAL, and this pins it. The handler reads " +
        "`if e~=4 and e<9 then return end`, so a finger that lands in column 0 " +
        "and slides to column 2 sends column 0's macro once and never " +
        "corrects. Do NOT 'fix' this by firing on MOVE - that sprays " +
        "keystrokes across every target crossed",
    ).toEqual([key0]);
    expect(
      swept.slidAcrossBands,
      "forge: the same, across a band boundary rather than a column one",
    ).toEqual([key0 + 4]);
    expect(
      swept.cornerTap,
      "forge: a coalesced tap on the bank corner arms nothing and sends " +
        "nothing, because a bank armed by code 9 could never be released by " +
        "the gesture that armed it",
    ).toBe(0);

    process.stdout.write(
      "\nFORGE travel sweep, 16,384 presses:\n  " + report.join("\n  ") + "\n",
    );
    expect(report.length, "the sweep reported every measurement").toBe(8);
  }, 120000);

  it("reaches both ends of LATTICE's range across the whole travel", async () => {
    // MEASURED AND CLEAN (plan 11-07). LATTICE's bench note has three clauses.
    // "Not precise enough" was the fast tap and 11-02 fixed it at +8; "CLAMP IT
    // BETTER" had never been looked at, and CONSOLE's clamp complaint sounded
    // identical and turned out to be a real ceiling, so an assertion that the
    // fast-tap fix covered this one was not evidence.
    //
    // Swept: every one of the 16,384 raw coordinates, pressed and lifted. The
    // emitted set is exactly the set the card's own header claims - 49 notes
    // from @BASE to @BASE + 8 + 8*@ROW, four octaves - with both ends present
    // and nothing truncated away. There is no clamp to improve because there is
    // no value the arithmetic cannot emit, which is the opposite of what
    // CONSOLE's sweep found and is why this is a measurement rather than a fix.
    const entry = entryById("lattice");
    const base = knobValueOf(entry, "base");
    const row = knobValueOf(entry, "rowInterval");
    const swept = await sweepLattice(entry);
    const notes = [...swept.area.keys()].sort((a, b) => a - b);
    const report: string[] = [];

    // The range the ENTRY claims, derived from its own two lines:
    // n = @BASE + i%9 + (8 - i//9) * @ROW over i = 0..80.
    const lowest = base;
    const highest = base + 8 + 8 * row;
    report.push(
      `emitted ${notes.length} distinct notes, ${notes[0]} to ${notes[notes.length - 1]}`,
    );
    report.push(`the card's own arithmetic claims ${lowest} to ${highest}`);
    report.push(
      `raw coordinates per note: ${notes.map((n) => `${n}:${swept.area.get(n)}`).join(" ")}`,
    );
    report.push(`coordinates that sounded something: ${swept.cells} of 16384`);

    expect(
      notes,
      "lattice: THE BOTTOM OF THE RANGE MUST BE REACHABLE. It is @BASE, at " +
        "the bottom-left cell, and a coordinate division that lost the last " +
        "column or the last row would take it away silently",
    ).toContain(lowest);
    expect(
      notes,
      "lattice: THE TOP OF THE RANGE MUST BE REACHABLE. It is " +
        "@BASE + 8 + 8*@ROW, at the top-right cell. CONSOLE's defect was " +
        "exactly this shape - an arithmetic ceiling one step under the top of " +
        `the declared range - so it is asserted here by number: ${highest}`,
    ).toContain(highest);
    expect(
      notes.length,
      "lattice: an isomorphic grid in @ROW-semitone rows emits every " +
        "semitone between its ends, because a nine-wide row covers more than " +
        `@ROW consecutive steps. Observed ${notes.length}: ${notes.join(", ")}`,
    ).toBe(highest - lowest + 1);
    for (const note of notes)
      expect(
        note >= 0 && note <= 127,
        `lattice: note ${note} is outside the MIDI range`,
      ).toBe(true);
    expect(
      swept.cells,
      "lattice: every raw coordinate on the pad is inside some cell, so every " +
        "one of them must sound a note. A coordinate that sounded nothing is a " +
        "hole in the map",
    ).toBe(128 * 128);

    process.stdout.write(
      "\nLATTICE travel sweep, 16,384 presses:\n  " +
        report.join("\n  ") +
        "\n",
    );
    expect(report.length, "the sweep reported every measurement").toBe(4);
  }, 120000);

  it("arms one cell per cell a swipe crosses, on EUCLID, SONAR and STEPS", async () => {
    const report: string[] = [];

    for (const row of SWIPE_ENTRIES) {
      const entry = entryById(row.id);

      // 1. THE SWIPE. One contact along row 4, one RAW coordinate a tick, so
      //    the host's change gate delivers every sample. Nine cells crossed;
      //    the entry's own rule says how many of them can change.
      const swiped: number[] = [];
      {
        const { host, sim } = await open(entry);
        try {
          const y = cellCentre(4);
          const before = armVector(sim, row.armLayer);
          host.touchDown(0, 0, y);
          host.tick();
          let delivered = 1;
          for (let x = 1; x <= 127; x += 1) {
            host.touchMove(0, x, y);
            host.tick();
            delivered += 1;
          }
          host.touchUp(0, 127, y);
          host.tick();
          const after = armVector(sim, row.armLayer);
          for (let cell = 0; cell < 81; cell += 1)
            if (before[cell] !== after[cell]) swiped.push(cell);
          expect(
            delivered,
            `${row.id}: the swipe delivered nothing, so nothing below proves ` +
              "anything",
          ).toBe(128);
        } finally {
          host.close();
        }
      }

      const crossed: number[] = [];
      for (let column = 0; column < 9; column += 1) {
        const cell = 4 * 9 + column;
        if (row.eligible(cell)) crossed.push(cell);
      }
      expect(
        crossed.length,
        `${row.id}: row 4 crosses no cell this entry can arm, so the swipe ` +
          "assertion would be vacuous",
      ).toBeGreaterThan(0);
      report.push(
        `${row.id}: swipe across row 4 changed ${swiped.length} cell(s) ` +
          `[${swiped.join(", ")}], eligible [${crossed.join(", ")}]`,
      );
      // The CELLS, not the count. A guard keyed on the wrong index would still
      // change the right NUMBER of cells while changing the wrong ones - which
      // is the shape of defect 11-07's endpoint assertion caught on FORGE.
      expect(
        swiped,
        `${row.id}: A SWIPE MUST ARM EVERY CELL IT CROSSES, ONCE EACH. The ` +
          "callback used to filter every MOVE out at its first line, so a " +
          "drag changed only the cell it landed on: measured before the fix, " +
          "0 cells on euclid and 1 on sonar and steps. " +
          `${row.why}. Observed [${swiped.join(", ")}]`,
      ).toEqual(crossed);

      // 2. THE RESTING FINGER. Every sample is a DISTINCT coordinate inside one
      //    cell, because the host's enqueue is change-gated on (event, x, y)
      //    per contact and a probe that re-sent one point would measure the
      //    host's dedup and call it the entry's.
      {
        const { host, sim } = await open(entry);
        try {
          const cell = 4 * 9 + 3;
          expect(
            row.eligible(cell),
            `${row.id}: the resting probe sits on a cell this entry ignores`,
          ).toBe(true);
          const xs = coordinatesIn(3);
          const ys = coordinatesIn(4);
          const at = hwOfCell(cell);
          host.touchDown(0, xs[0], ys[0]);
          host.tick();
          const armed = sim.layer(at, row.armLayer).pha;
          let last = armed;
          let transitions = 0;
          let delivered = 1;
          for (const y of ys)
            for (const x of xs) {
              if (x === xs[0] && y === ys[0]) continue;
              host.touchMove(0, x, y);
              host.tick();
              delivered += 1;
              const now = sim.layer(at, row.armLayer).pha;
              if (now !== last) transitions += 1;
              last = now;
            }
          host.touchUp(0, xs[xs.length - 1], ys[ys.length - 1]);
          host.tick();
          report.push(
            `${row.id}: rested inside cell ${cell}, ${delivered} sample(s) ` +
              `delivered, ${transitions} further change(s)`,
          );
          expect(
            delivered,
            `${row.id}: the resting probe delivered ${delivered} samples, ` +
              "which is not enough to tell a guard from a coincidence",
          ).toBeGreaterThan(100);
          // COUNTED, NOT ASSERTED AS A BOOLEAN. Unguarded this is one toggle
          // per sample: 209 further changes against 209 samples, a cell
          // flickering at 100 Hz under a still finger.
          expect(
            transitions,
            `${row.id}: A FINGER RESTING INSIDE ONE CELL MUST CHANGE IT ONCE. ` +
              "A MOVE arrives every 10 ms, so accepting drags without a " +
              "per-contact last-cell guard toggles the cell at 100 Hz. " +
              `Observed ${transitions} change(s) after the first sample, over ` +
              `${delivered - 1} further samples`,
          ).toBe(0);
        } finally {
          host.close();
        }
      }

      // 3. THE SECOND CONTACT. What the s.q[i] clear buys: a fresh press on
      //    the cell the last contact ended on must not be swallowed.
      {
        const { host, sim } = await open(entry);
        try {
          const cell = 4 * 9 + 3;
          const at = hwOfCell(cell);
          const x = cellCentre(3);
          const y = cellCentre(4);
          const rest = sim.layer(at, row.armLayer).pha;
          host.touchDown(0, x, y);
          host.tick();
          const first = sim.layer(at, row.armLayer).pha;
          host.touchUp(0, x, y);
          host.tick();
          // A DIFFERENT coordinate in the SAME cell, so the host's change gate
          // delivers it and the entry's guard is the only thing that could
          // swallow it.
          host.touchDown(0, x + 1, y);
          host.tick();
          const second = sim.layer(at, row.armLayer).pha;
          host.touchUp(0, x + 1, y);
          host.tick();
          report.push(
            `${row.id}: press, lift, press on cell ${cell}: ` +
              `${rest} -> ${first} -> ${second}`,
          );
          expect(
            first,
            `${row.id}: the first press did not arm cell ${cell}, so the ` +
              "second-contact assertion below proves nothing",
          ).not.toBe(rest);
          expect(
            second,
            `${row.id}: A SECOND CONTACT ON THE SAME CELL MUST NOT BE ` +
              "SWALLOWED. The per-contact guard remembers the last cell a " +
              "contact touched; without the clear on contact end it would " +
              "still be remembering it when the next press arrives, and the " +
              `cell would toggle every other time. Observed ${rest} -> ` +
              `${first} -> ${second}`,
          ).toBe(rest);
        } finally {
          host.close();
        }
      }

      // 4. THREE FAST TAPS ON ONE CELL, and this is what the nine characters
      //    of `e==1 and ` in front of the dedup actually buy. Code 9 is a whole
      //    contact in ONE message with no lift after it, so a guard that
      //    deduped every event would still be holding this cell when the next
      //    tap arrived: measured on the bare shape, 0 -> 255 -> 255 -> 255, a
      //    step that can be armed and never disarmed from the pad.
      {
        const { host, sim } = await open(entry);
        try {
          const cell = 4 * 9 + 3;
          const at = hwOfCell(cell);
          const y = cellCentre(4);
          const seen: number[] = [sim.layer(at, row.armLayer).pha];
          for (let n = 0; n < 3; n += 1) {
            // A DIFFERENT coordinate each time, inside the same cell, so the
            // host's change gate delivers all three.
            host.touchTap(0, cellCentre(3) + n, y);
            host.tick();
            seen.push(sim.layer(at, row.armLayer).pha);
          }
          report.push(
            `${row.id}: three fast taps on cell ${cell}: ${seen.join(" -> ")}`,
          );
          expect(
            seen,
            `${row.id}: A FAST TAP IS A WHOLE CONTACT AND EVERY ONE OF THEM ` +
              "MUST LAND. Event code 9 carries a down AND an up in one " +
              "message and has no lift after it to clear the last-cell " +
              "guard, so a dedup applied to every event swallows every tap " +
              "after the first and the cell can be armed but never disarmed. " +
              `Observed ${seen.join(" -> ")}`,
          ).toEqual([seen[0], seen[1], seen[0], seen[1]]);
          expect(
            seen[1],
            `${row.id}: the first fast tap changed nothing, so the three-tap ` +
              "assertion proves nothing",
          ).not.toBe(seen[0]);
        } finally {
          host.close();
        }
      }
    }

    // -----------------------------------------------------------------------
    // SONAR'S OTHER TWO ASKS (plan 11-08), extended onto this test rather than
    // given a fourth of their own: they are the same card and the same run.
    // -----------------------------------------------------------------------

    // 5. THE CENTRE IS ALWAYS LIT, AND THE LAYER IS THE WHOLE ASSERTION.
    //    Cell 40 is the sweep's own pivot. Setup lights it on LAYER 0, which
    //    neither the Timer (layer 2) nor the arming touch (layer 1) writes, so
    //    the interesting moment is not tick 0 - it is the tick the sweep is
    //    ON TOP of it, which is what a Setup-only change can get wrong.
    {
      const entry = entryById("sonar");
      const { host, sim } = await open(entry);
      try {
        const at = hwOfCell(40);
        const restRgb = rgbAt(host.frame, 40);
        expect(
          litAt(host.frame, 40),
          "sonar: THE CENTRE MUST BE LIT AT REST. Cell 40 is the sweep's " +
            "pivot and it used to be the one cell on the pad with nothing to " +
            `say. Observed ${restRgb} at tick 0`,
        ).toBe(true);

        // Run until the sweep is demonstrably ON cell 40, then look; then run
        // on until its trail has expired and look again. THE SECOND LOOK IS
        // THE ONE THAT PINS THE LAYER CHOICE: a hub written on layer 2 is lit
        // at rest and lit under the sweep, and goes black when the sweep's
        // 42-tick decay runs out from under it.
        let sweptTick = -1;
        let sweptRgb = "";
        for (let tick = 1; tick <= 400 && sweptTick < 0; tick += 1) {
          host.tick();
          if (sim.layer(at, 2).pha === 0) continue;
          sweptTick = tick;
          sweptRgb = rgbAt(host.frame, 40);
        }
        expect(
          sweptTick,
          "sonar: the sweep never reached cell 40 in 400 ticks, so the " +
            "assertions below would be vacuous - they would only be " +
            "re-reading tick 0",
        ).toBeGreaterThan(0);
        expect(
          litAt(host.frame, 40),
          `sonar: the centre reads ${sweptRgb} while the sweep is over it`,
        ).toBe(true);

        let afterTick = sweptTick;
        for (let tick = 0; tick < 60; tick += 1) {
          host.tick();
          afterTick += 1;
        }
        const afterRgb = rgbAt(host.frame, 40);
        report.push(
          `sonar: centre cell 40 reads ${restRgb} at rest, ${sweptRgb} at ` +
            `tick ${sweptTick} with the sweep on top of it, and ${afterRgb} ` +
            `at tick ${afterTick} once the trail has expired`,
        );
        expect(
          sim.layer(at, 2).pha,
          "sonar: the sweep's trail had not expired by tick " +
            `${afterTick}, so the assertion below is not measuring what it ` +
            "claims",
        ).toBe(0);
        expect(
          litAt(host.frame, 40),
          "sonar: THE CENTRE MUST SURVIVE THE SWEEP PASSING OVER IT. That is " +
            "the case a bench will actually look at, and it is the one a " +
            "Setup-only change gets wrong by choosing the layer the Timer " +
            "writes: on layer 2 the hub is lit at rest and lit under the " +
            "sweep, and then the 42-tick decay runs it down to black and " +
            `nothing ever puts it back. Observed ${afterRgb} at tick ` +
            `${afterTick}`,
        ).toBe(true);
        // And the layer choice itself, pinned by name rather than inferred
        // from the picture, so a future edit that moved the hub onto a layer
        // that merely happens to be quiet today is caught.
        expect(
          sim.layer(at, 0).pha,
          "sonar: the centre is written on LAYER 0, which neither the Timer " +
            "(layer 2) nor the arming touch (layer 1) writes. Observed layer " +
            `0 phase ${sim.layer(at, 0).pha}`,
        ).toBe(255);
      } finally {
        host.close();
      }
    }

    // 6. EVERY NOTE THE SWEEP FIRES IS RELEASED, AND THE GATE IS ONE STEP.
    //    The bench asked for notes that "disappear after a while" and the
    //    source already does it: every note goes into s.z and the FOLLOWING
    //    fire releases the whole list before playing anything new. This pins
    //    that, because it is the thing a future edit to the Timer would break
    //    silently - a hung note is inaudible in a unit run.
    {
      const entry = entryById("sonar");
      const { host } = await open(entry);
      try {
        // Derived from the entry's own knob, never pasted: one step is @PERIOD
        // milliseconds and the host ticks at 10 ms.
        const stepTicks = knobValueOf(entry, "sweep") / 10;
        host.touchTap(0, cellCentre(4), cellCentre(0));
        host.tick();
        const mark = host.midi.length;
        let seen = mark;
        const opened = new Map<number, number>();
        const gaps: number[] = [];
        let hung = 0;
        let fired = 0;
        for (let tick = 0; tick < 400; tick += 1) {
          host.tick();
          while (seen < host.midi.length) {
            const message = host.midi[seen];
            seen += 1;
            if (message.cmd === 144) {
              fired += 1;
              if (opened.has(message.p1)) hung += 1;
              opened.set(message.p1, tick);
              continue;
            }
            if (message.cmd !== 128) continue;
            const at = opened.get(message.p1);
            if (typeof at === "undefined") continue;
            gaps.push(tick - at);
            opened.delete(message.p1);
          }
        }
        report.push(
          `sonar: ${fired} note(s) fired, ${gaps.length} released after ` +
            `${[...new Set(gaps)].join(", ")} tick(s), ${opened.size} still ` +
            "open at the end of 400 ticks",
        );
        // NON-VACUITY ON THE NOTE-ONS, NOT ON THE RELEASES, and the order is
        // the point: a Timer that never releases anything produces zero gaps,
        // and a run that asserted `gaps.length > 0` first would fail with
        // "the sweep fired nothing" - the wrong diagnosis for a hung note.
        expect(
          fired,
          "sonar: the sweep fired no note at all in 400 ticks, so every " +
            "assertion below would be vacuous",
        ).toBeGreaterThan(0);
        expect(
          [...opened.keys()],
          "sonar: EVERY NOTE THE SWEEP STARTS MUST BE RELEASED. The Timer's " +
            "first act is to send note-off for everything in s.z; without it " +
            "each fired pitch is held forever and the track hangs. Left open " +
            `at the end of 400 ticks, after ${fired} note-on(s)`,
        ).toEqual([]);
        expect(
          gaps.length,
          "sonar: no release was paired to a note-on, so the gap assertion " +
            "below proves nothing",
        ).toBeGreaterThan(0);
        expect(
          hung,
          "sonar: a note was started twice without being released in " +
            "between, which is a hung voice",
        ).toBe(0);
        expect(
          Math.max(...gaps),
          "sonar: A NOTE MUST BE RELEASED WITHIN ONE STEP. The Timer's first " +
            "act is to release everything in s.z, so a note fired at step k " +
            `is off at step k+1 - ${stepTicks} ticks at the default @PERIOD. ` +
            `Observed ${gaps.join(", ")}`,
        ).toBe(stepTicks);
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nthe swipe family, plan 11-08:\n  " + report.join("\n  ") + "\n",
    );
    expect(report.length, "every entry reported all four probes").toBe(
      SWIPE_ENTRIES.length * 4 + 2,
    );
  }, 120000);

  it("sends a MORPH corner only when that corner moved, and never a stale zero", async () => {
    const entry = entryById("morph");
    const base = knobValueOf(entry, "ccBase");
    // The four corners send @CCB+1 .. @CCB+4, in the entry's own corner order:
    // j=1 is u*v (top left), j=2 is x*v (top right), j=3 is u*y (bottom left),
    // j=4 is x*y (bottom right), where u = 127-x and v = 127-y.
    const CORNERS = [
      { cc: base + 1, name: "top left" },
      { cc: base + 2, name: "top right" },
      { cc: base + 3, name: "bottom left" },
      { cc: base + 4, name: "bottom right" },
    ];
    const report: string[] = [];

    /** Drag one contact across the pad, one raw coordinate a tick. */
    const drag = async (
      label: string,
      path: readonly (readonly [number, number])[],
    ): Promise<{ samples: number; sent: HostMidi[] }> => {
      const { host } = await open(entry);
      try {
        host.touchDown(0, path[0][0], path[0][1]);
        host.tick();
        let samples = 1;
        for (let i = 1; i < path.length; i += 1) {
          host.touchMove(0, path[i][0], path[i][1]);
          host.tick();
          samples += 1;
        }
        const sent = [...host.midi];
        host.touchUp(0, path[path.length - 1][0], path[path.length - 1][1]);
        host.tick();
        const perCc = CORNERS.map((corner) => {
          const values = sent
            .filter((m) => m.p1 === corner.cc)
            .map((m) => m.p2);
          return `cc ${corner.cc} (${corner.name}) ${values.length}`;
        });
        report.push(
          `${label}: ${samples} sample(s) accepted, ${sent.length} message(s) ` +
            `against ${samples * 4} unguarded - ${perCc.join(", ")}`,
        );
        return { samples, sent };
      } finally {
        host.close();
      }
    };

    // 1. THE TOP EDGE, y = 0. The arithmetic makes this the clean case and it
    //    is not a coincidence: at y = 0 both u*y and x*y are exactly 0 for
    //    every x, so the two bottom corners never leave zero for the whole
    //    stroke - which is the bench's "don't send 0 value" stated as
    //    arithmetic rather than as a complaint.
    const top: [number, number][] = [];
    for (let x = 0; x <= 127; x += 1) top.push([x, 0]);
    const edge = await drag("top edge, y=0", top);

    expect(
      edge.samples,
      "morph: the top-edge drag delivered nothing, so nothing below proves " +
        "anything",
    ).toBe(128);
    expect(
      edge.sent.length,
      "morph: A CORNER MUST NOT BE RE-SENT WHEN IT HAS NOT MOVED. Four CCs " +
        `left on every accepted sample, so an unguarded run is ${edge.samples * 4} ` +
        `messages. Observed ${edge.sent.length}`,
    ).toBeLessThan(edge.samples * 4);

    for (const corner of CORNERS) {
      const values = edge.sent
        .filter((m) => m.p1 === corner.cc)
        .map((m) => m.p2);
      // 1a. NO CORNER REPEATS ITSELF. This is the clause, asserted directly
      //     rather than through a count: a card that suppressed the WRONG
      //     corners would still send fewer messages.
      for (let i = 1; i < values.length; i += 1)
        expect(
          values[i],
          `morph: cc ${corner.cc} (${corner.name}) sent ${values[i]} twice ` +
            `in a row at message ${i}. self.p[j] holds the last value sent ` +
            "and the send is guarded on z ~= s.p[j]",
        ).not.toBe(values[i - 1]);
      // 1b. NO CORNER OPENS WITH A ZERO. self.p is initialised to zeros, so a
      //     corner that is at 0 and was at 0 - which is every corner at Setup
      //     and every corner the finger is far from - never speaks at all.
      if (values.length > 0)
        expect(
          values[0],
          `morph: cc ${corner.cc} (${corner.name}) opened with a 0. ` +
            "self.p={0,0,0,0} is half of the mechanism: a corner already at " +
            "zero has not changed, so it has nothing to say",
        ).not.toBe(0);
    }

    // 1c. THE TWO CORNERS THE FINGER IS NOWHERE NEAR SAY NOTHING AT ALL.
    for (const corner of CORNERS.slice(2)) {
      const values = edge.sent.filter((m) => m.p1 === corner.cc);
      expect(
        values.length,
        `morph: cc ${corner.cc} (${corner.name}) is exactly 0 at every point ` +
          "of a y = 0 stroke, and a corner that is at zero and was at zero " +
          `must emit nothing. Observed ${values.length} message(s)`,
      ).toBe(0);
    }

    // 1d. THE CORNER THE FINGER LEAVES SENDS ITS ZERO EXACTLY ONCE. This is
    //     the half of the reading that the literal "never emit 0" would get
    //     wrong: without it the receiver holds a stale non-zero value for a
    //     corner the finger has left, which is a worse bug than the reported
    //     one.
    {
      const values = edge.sent
        .filter((m) => m.p1 === CORNERS[0].cc)
        .map((m) => m.p2);
      const zeros = values.filter((v) => v === 0);
      expect(
        zeros.length,
        `morph: cc ${CORNERS[0].cc} (${CORNERS[0].name}) runs from 127 down ` +
          "to 0 across this stroke, and the finger LEAVING it must send its " +
          `0 exactly once. Observed ${zeros.length} zero(s) in ` +
          `${values.length} message(s)`,
      ).toBe(1);
      expect(
        values[values.length - 1],
        `morph: the departed corner's 0 must be its LAST word, not a value ` +
          `it passed through. Observed ${values.slice(-3).join(", ")}`,
      ).toBe(0);
    }

    // 2. A JITTERING FINGER, which is what the bench actually had under its
    //    hand. Every sample is a DISTINCT coordinate inside one cell - the
    //    host's enqueue is change-gated on (event, x, y) per contact, so a
    //    probe that re-sent one point would measure the host's dedup and call
    //    it the entry's. A one-unit wobble moves the RAW coordinate every
    //    sample and moves a derived corner weight far less often.
    const wobble: [number, number][] = [];
    for (const y of coordinatesIn(4))
      for (const x of coordinatesIn(3)) wobble.push([x, y]);
    const held = await drag("jitter inside one cell", wobble);
    expect(
      held.samples,
      "morph: the jitter probe delivered too few samples to tell a guard " +
        "from a coincidence",
    ).toBeGreaterThan(100);
    expect(
      held.sent.length,
      "morph: A JITTERING FINGER MUST NOT RESTATE A CORNER THAT HAS NOT " +
        `MOVED. Unguarded this stroke is ${held.samples * 4} messages, four ` +
        `on every sample. Observed ${held.sent.length}`,
    ).toBeLessThan(held.samples * 4);
    for (const corner of CORNERS) {
      const values = held.sent
        .filter((m) => m.p1 === corner.cc)
        .map((m) => m.p2);
      for (let i = 1; i < values.length; i += 1)
        expect(
          values[i],
          `morph: cc ${corner.cc} (${corner.name}) restated ${values[i]} ` +
            `under a jittering finger, at message ${i}`,
        ).not.toBe(values[i - 1]);
    }

    process.stdout.write(
      "\nMORPH suppression, plan 11-08:\n  " + report.join("\n  ") + "\n",
    );
    expect(report.length, "both strokes reported").toBe(2);
  }, 120000);

  it("gives a MORPH corner tap one message, and leaves the morph alone", async () => {
    // THE BENCH NOTE THIS ANSWERS: "mapping mode needed in" (plan 11-09's
    // checkpoint), answered "when you tap morphs corners it should only send
    // one MIDI message".
    //
    // WHY IT IS THE SAME COMPLAINT AS THE SUPPRESSION CLAUSE ABOVE. In a DAW,
    // MIDI-learn binds whichever message arrives first. With four CCs leaving
    // on every accepted sample, corner 3 cannot be bound to anything: the
    // moment you hit learn, one of the other three lands first and takes it.
    // That is why "mapping mode needed in" sat in the same sentence as "if
    // something doesn't change don't send it don't send 0 value" - both
    // clauses are about the pad shouting over itself. 11-08 fixed the
    // shouting; this makes each corner individually reachable.
    //
    // THE MEASUREMENT THAT DECIDED THE SHAPE, TAKEN BEFORE THE CHANGE. A press
    // at the CENTRE OF A CORNER BLOCK - which is where a finger aimed at a
    // corner actually lands - emitted FOUR messages, from rest and from
    // elsewhere alike. Only a press on the exact extreme pixel (0,0), where
    // three weights are arithmetically 0 and 11-08's s.p holds them silent,
    // already emitted one. So the gap is real at the point a finger reaches,
    // and the non-vacuity clause below pins the probe to such a point.
    //
    // THE DISCRIMINATION IS THE ONSET EDGE, e==4 or e>8, THE SAME ONE arc.ts
    // TAKES IN THIS PLAN. The rejected alternative was "only a coalesced
    // DOWNUP counts as a tap", and it is rejected by measurement twice over:
    // the shipped src/lib/sim/touch.ts NEVER emits 9 - a 300 ms press and the
    // fastest press a pointer can make both deliver 4 then 5 - so the feature
    // would be invisible in the browser (PREV-01), and on hardware a
    // deliberate tap aimed at a MIDI-learn button is exactly the slow kind
    // that arrives as 4 then 5.
    const entry = entryById("morph");
    const base = knobValueOf(entry, "ccBase");
    const setup = entry.source.kind === "lua" ? entry.source.setup : "";
    // THE CORNER BASES ARE READ OUT OF THE ENTRY'S OWN self.k, never typed, so
    // moving a corner reddens this test instead of escaping it.
    const kDecl = /self\.k=\{([^}]*)\}/.exec(setup);
    expect(kDecl, "morph: self.k must be declared in the Setup").not.toBe(null);
    const K = (kDecl as RegExpExecArray)[1].split(",").map(Number);
    expect(K.length, "morph: four corner blocks").toBe(4);
    // The 2x2 block, in the entry's own words: cells k + d%2 + d//2*9.
    const blockOf = (k: number): number[] =>
      [0, 1, 2, 3].map((d) => k + (d % 2) + Math.floor(d / 2) * 9);
    const cellOf = (x: number, y: number): number =>
      Math.floor((x * 9) / 128) + Math.floor((y * 9) / 128) * 9;
    /** The bilinear weights the entry computes, in the entry's own order. */
    const weightsAt = (x: number, y: number): number[] => {
      const u = 127 - x;
      const v = 127 - y;
      return [
        Math.floor((u * v) / 127),
        Math.floor((x * v) / 127),
        Math.floor((u * y) / 127),
        Math.floor((x * y) / 127),
      ];
    };
    /** A point in the middle of corner j's 2x2 block. */
    const aimAt = (k: number): [number, number] => {
      const column = (c: number): number[] => {
        const out: number[] = [];
        for (let t = 0; t <= 127; t += 1)
          if (Math.floor((t * 9) / 128) === c) out.push(t);
        return out;
      };
      const cx = k % 9;
      const cy = Math.floor(k / 9);
      const xs = [...column(cx), ...column(cx + 1)];
      const ys = [...column(cy), ...column(cy + 1)];
      return [xs[Math.floor(xs.length / 2)], ys[Math.floor(ys.length / 2)]];
    };
    const report: string[] = [];

    for (let j = 0; j < 4; j += 1) {
      const [x, y] = aimAt(K[j]);
      const w = weightsAt(x, y);
      // NON-VACUITY. At the exact extreme pixel three weights are 0 and 11-08
      // already delivered one message, so a probe there would prove nothing.
      // Every weight here is non-zero, so an unguarded card sends FOUR.
      for (let n = 0; n < 4; n += 1)
        expect(
          w[n],
          `morph: the probe for corner ${j + 1} must land where ALL FOUR ` +
            "corners have a non-zero weight, or a one-message result is the " +
            `old behaviour wearing the new one's clothes. Weights ${w.join(", ")}`,
        ).toBeGreaterThan(0);
      expect(
        blockOf(K[j]),
        `morph: the probe for corner ${j + 1} must be inside that corner's ` +
          "own 2x2 block, derived from self.k",
      ).toContain(cellOf(x, y));

      for (const mode of ["slow", "fast"] as const) {
        const { host } = await open(entry);
        try {
          if (mode === "fast") {
            host.touchTap(0, x, y);
            host.tick();
          } else {
            host.touchDown(0, x, y);
            host.tick();
            host.touchUp(0, x, y);
            host.tick();
          }
          const sent = [...host.midi];
          report.push(
            `${mode.padEnd(4)} tap on corner ${j + 1} at (${x},${y}): ` +
              `${sent.length} message(s) ` +
              sent.map((m) => `(cc ${m.p1}, ${m.p2})`).join(" ") +
              ` - unguarded this point is 4, weights ${w.join("/")}`,
          );
          // 1. EXACTLY ONE MESSAGE.
          expect(
            sent.length,
            `morph: A CORNER TAP MUST SEND ONE MIDI MESSAGE (${mode} tap on ` +
              `corner ${j + 1}). All four weights are non-zero here, so the ` +
              `unguarded card sends 4. Observed ${sent.length}: ` +
              sent.map((m) => `(cc ${m.p1}, ${m.p2})`).join(" "),
          ).toBe(1);
          // 2. AND IT IS THE RIGHT ONE. A card that always spoke for corner 1
          //    would pass clause 1 and fail here, which is the difference
          //    between counting messages and reading them.
          expect(
            sent[0].p1,
            `morph: the one message must be THAT corner's. Corner ${j + 1} ` +
              `owns cc ${base + j + 1}; cc ${sent[0].p1} arrived`,
          ).toBe(base + j + 1);
          expect(
            sent[0].p2,
            `morph: the value must be the corner's own bilinear weight at ` +
              `(${x},${y})`,
          ).toBe(w[j]);
        } finally {
          host.close();
        }
      }

      // 3. FROM ELSEWHERE, not only from rest. 11-08's s.p is not reset or
      //    bypassed by the corner branch, so a corner tap that arrives after a
      //    stroke which left the other three non-zero still speaks once.
      {
        const { host } = await open(entry);
        try {
          host.touchDown(0, 64, 64);
          host.tick();
          for (let s = 0; s < 8; s += 1) {
            host.touchMove(0, 64 + s, 64 - s);
            host.tick();
          }
          host.touchUp(0, 71, 57);
          host.tick();
          const from = host.midi.length;
          expect(
            from,
            "morph: the priming stroke sent nothing, so 'from elsewhere' is " +
              "the same probe as 'from rest'",
          ).toBeGreaterThan(3);
          host.touchDown(0, x, y);
          host.tick();
          const sent = host.midi.slice(from);
          report.push(
            `after a stroke, corner ${j + 1}: ${sent.length} message(s) ` +
              sent.map((m) => `(cc ${m.p1}, ${m.p2})`).join(" "),
          );
          expect(
            sent.length,
            `morph: a corner tap arriving FROM ELSEWHERE must still speak ` +
              `once. Corner ${j + 1} sent ${sent.length}`,
          ).toBe(1);
          expect(sent[0].p1, `morph: and it must be corner ${j + 1}'s`).toBe(
            base + j + 1,
          );
        } finally {
          host.close();
        }
      }
    }

    // 4. THE CONTINUOUS MORPH IS UNMOVED, AND IT IS ASSERTED AGAINST A LITERAL
    //    CAPTURED BEFORE THE CHANGE rather than against a count. 11-08 shipped
    //    a first swipe shape whose output was indistinguishable from the bug
    //    it was fixing, and a message count would have gone green on it. This
    //    stroke starts at the centre cell - so its onset is NOT in a corner -
    //    and runs the diagonal into the bottom-right block, so it also proves
    //    that a MOVE sample crossing a corner still morphs.
    const DIAGONAL_BEFORE = [
      "16:31 17:31 18:31 19:32 16:30 19:33 16:29 19:34 16:28",
      "19:35 16:27 19:36 16:26 19:37 16:25 19:38 16:24 19:39",
      "16:23 19:40 16:22 19:41 17:30 18:30 19:43 16:21 19:44",
      "16:20 19:45 16:19 19:46 16:18 19:47 17:29 18:29 19:49",
      "16:17 19:50 16:16 19:51 16:15 19:52 17:28 18:28 19:54",
      "16:14 19:55 16:13 19:56 17:27 18:27 19:58 16:12 19:59",
      "16:11 19:60 17:26 18:26 19:62 16:10 19:63 17:25 18:25",
      "19:65 16:9 19:66 17:24 18:24 19:68 16:8 19:69 17:23",
      "18:23 19:71 16:7 19:72 17:22 18:22 19:74 16:6 19:75",
      "17:21 18:21 19:77 16:5 19:78 17:20 18:20 19:80 16:4",
      "19:81 17:19 18:19 19:83 17:18 18:18 19:85 16:3 19:86",
      "17:17 18:17 19:88 17:16 18:16 19:90 16:2 19:91 17:15",
      "18:15 19:93 17:14 18:14 19:95 17:13 18:13 19:97 16:1",
      "19:98 17:12 18:12 19:100 17:11 18:11 19:102 17:10 18:10",
      "19:104 16:0 19:105 17:9 18:9 19:107 17:8 18:8 19:109",
      "17:7 18:7 19:111 17:6 18:6 19:113 17:5 18:5 19:115",
      "17:4 18:4 19:117 17:3 18:3 19:119 17:2 18:2 19:121",
      "17:1 18:1 19:123 17:0 18:0 19:125 19:127",
    ]
      .join(" ")
      .split(" ");
    {
      const { host } = await open(entry);
      try {
        expect(
          cellOf(64, 64),
          "morph: the invariance stroke must NOT begin in a corner block",
        ).toBe(40);
        host.touchDown(0, 64, 64);
        host.tick();
        for (let t = 65; t <= 127; t += 1) {
          host.touchMove(0, t, t);
          host.tick();
        }
        host.touchUp(0, 127, 127);
        host.tick();
        const seq = host.midi.map((m) => `${m.p1}:${m.p2}`);
        report.push(
          `diagonal from the centre cell: ${seq.length} message(s), ` +
            `${DIAGONAL_BEFORE.length} captured before the change`,
        );
        expect(
          seq.join(" "),
          "morph: THE CONTINUOUS MORPH MUST BE BYTE-IDENTICAL. This is the " +
            "sequence a diagonal stroke from the centre emitted BEFORE the " +
            "corner-tap branch existed, captured against the entry as 11-08 " +
            "left it and committed as a literal. A corner branch that reached " +
            "MOVE samples would truncate it here",
        ).toBe(DIAGONAL_BEFORE.join(" "));
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nMORPH corner taps, plan 11-09.1:\n  " + report.join("\n  ") + "\n",
    );
    expect(
      report.length,
      "four corners times three probes, plus the stroke",
    ).toBe(13);
  }, 120000);

  it("moves ARC's heart and ARC's controller together, at three depths", async () => {
    // THE BENCH NOTE THIS ANSWERS: "cannot see amplitude need visual feedback
    // for that" (plan 11-09).
    //
    // ARC paints a 3x3 heart on layer 1 and sends a triangle on a CC. Until
    // 11-09 the heart was painted with the RAW triangle and the CC was scaled
    // by the depth - s.d = 127 - y - so at the bottom edge of the pad the
    // controller pinned at 64 and the card was sending NOTHING while the heart
    // went on swinging its full travel. The picture lied about the amplitude,
    // which is what the bench saw.
    //
    // THE ASSERTION IS A CORRELATION, NOT A BRIGHTNESS. Three depths, and the
    // heart's travel must be ordered the same way the controller's excursion
    // from 64 is ordered, with a flat controller demanding a still heart. A
    // future re-scaling of the heart - a gamma, a floor, a different divisor -
    // keeps this green as long as it keeps the picture honest, and only a
    // picture that stops tracking the output turns it red.
    //
    // LAYER 1'S PHASE IS THE OBSERVABLE, NOT THE RENDERED FRAME. Layer 2's
    // swirl covers all 81 cells and is added into the same pixels, so a frame
    // reading would measure the swirl as well. Layer 1 carries no rate here -
    // Setup arms it with glp alone - so its phase is exactly the last value
    // glp wrote and nothing advances it behind the test's back.
    const entry = entryById("arc");
    const cc = knobValueOf(entry, "cc");
    // The heart, from the entry's own two loops: 40 + j*9 + k, j and k in -1..1.
    const HEART = [-1, 0, 1].flatMap((j) =>
      [-1, 0, 1].map((k) => 40 + j * 9 + k),
    );
    const RUN_TICKS = 400;

    type Depth = {
      label: string;
      depth: number;
      span: number;
      excursion: number;
      messages: number;
    };
    const depths: Depth[] = [];
    const report: string[] = [];

    for (const fraction of [0, 0.5, 1]) {
      const { host, sim } = await open(entry);
      try {
        const y = Math.round(fraction * host.coordMax);
        // x is held CONSTANT at every depth, so the OSCILLATOR RATE is the
        // same in all three runs and the only thing that moves is s.d.
        //
        // IT IS NO LONGER HELD AT THE MIDDLE, AND THE REASON IS THE HOLE PLAN
        // 11-09.1 PUT THERE. This probe used to press x = y = 64, which is
        // cell 40 exactly - and cell 40 is now the stop/resume toggle. At the
        // middle depth the probe was TAPPING THE STOP BUTTON, so the heart
        // froze, the travel read 0 and the rank correlation went red. That is
        // not a failure of this test, it is the documented cost of the feature
        // arriving as a measurement: a press that STARTS in cell 40 can no
        // longer set rate 14..18 at depth 56..70. x = 40 is column 2, so no
        // depth on this axis reaches the centre cell, and the rate it fixes
        // (1 + 40*31//127 = 10) is still identical across all three runs -
        // which is the only property this test ever needed from x.
        const x = 40;
        host.touchDown(0, x, y);
        host.tick();
        host.touchUp(0, x, y);
        host.tick();
        const from = host.midi.length;
        let low = Number.POSITIVE_INFINITY;
        let high = Number.NEGATIVE_INFINITY;
        for (let t = 0; t < RUN_TICKS; t += 1) {
          host.tick();
          for (const n of HEART) {
            const phase = sim.layer(
              screenToHw(n % 9, Math.floor(n / 9)),
              1,
            ).pha;
            if (phase < low) low = phase;
            if (phase > high) high = phase;
          }
        }
        const values = host.midi
          .slice(from)
          .filter((m) => m.p1 === cc)
          .map((m) => m.p2);
        const excursion = values.reduce(
          (worst, v) => Math.max(worst, Math.abs(v - 64)),
          0,
        );
        depths.push({
          label: `y=${y}`,
          depth: 127 - y,
          span: high - low,
          excursion,
          messages: values.length,
        });
        report.push(
          `${`y=${y}`.padEnd(6)} depth ${String(127 - y).padStart(3)}: heart ` +
            `travel ${high - low}, cc ${cc} excursion from 64 ${excursion}, ` +
            `over ${values.length} message(s)`,
        );
      } finally {
        host.close();
      }
    }

    // NON-VACUITY FIRST. A run that delivered no CC at all would satisfy every
    // correlation below for free.
    for (const each of depths)
      expect(
        each.messages,
        `arc at ${each.label}: the Timer sent no controller at all, so ` +
          "nothing below proves anything",
      ).toBeGreaterThan(RUN_TICKS / 4);
    expect(
      depths[0].excursion,
      "arc at the top edge: the controller must actually swing, or this test " +
        "is comparing two flat lines",
    ).toBeGreaterThan(0);

    // 1. THE FLAT CASE, WHICH IS THE ONE THE BENCH SAW. At the bottom edge the
    //    depth is zero, the controller is pinned at 64, and the heart must be
    //    still. Before plan 11-09 it swung its full travel here.
    const bottom = depths[depths.length - 1];
    expect(bottom.depth, "arc: the bottom edge of the pad is depth zero").toBe(
      0,
    );
    expect(
      bottom.excursion,
      "arc: at depth zero the controller cannot leave 64",
    ).toBe(0);
    expect(
      bottom.span,
      "arc: THE PICTURE MUST NOT LIE ABOUT THE AMPLITUDE. At the bottom edge " +
        "of the pad the depth is 0, so the card is sending a dead, constant " +
        `64 - and the heart moved ${bottom.span} anyway. That is the lie, ` +
        "made visible: a pad pulsing at full brightness while nothing at all " +
        "is going out. Scale the heart by the same s.d the controller is " +
        "scaled by",
    ).toBe(0);

    // 2. THE ORDERING AGREES AT EVERY PAIR. Rank rather than ratio, so any
    //    monotone re-scaling of the heart survives and only a decoupling
    //    fails.
    const sign = (n: number): number => (n === 0 ? 0 : n > 0 ? 1 : -1);
    for (let i = 0; i < depths.length; i += 1) {
      for (let j = i + 1; j < depths.length; j += 1) {
        expect(
          sign(depths[i].span - depths[j].span),
          `arc: the heart and the controller must move TOGETHER. Between ` +
            `${depths[i].label} and ${depths[j].label} the controller's ` +
            `excursion went ${depths[i].excursion} -> ${depths[j].excursion} ` +
            `while the heart's travel went ${depths[i].span} -> ` +
            `${depths[j].span}. A heart that does not follow the depth is a ` +
            "picture of an amplitude the card is not sending",
        ).toBe(sign(depths[i].excursion - depths[j].excursion));
      }
    }

    process.stdout.write(
      "\nARC amplitude, plan 11-09:\n  " + report.join("\n  ") + "\n",
    );
    expect(report.length, "three depths reported").toBe(3);
  }, 120000);

  it("stops ARC on a centre tap and resumes it on the next, once per press", async () => {
    // THE BENCH NOTE, AND THE ANSWER THAT REFRAMED IT. The note read "if you
    // press the center it stops, pressing it again resumes, not intuitive
    // enough" and ARC had NO stop, no resume and no toggle of any kind -
    // s.r = 1 + x*31//127 is at least 1 at every x, so the oscillator could
    // not reach rate 0. The open worry was that the hardware did something the
    // simulator does not reproduce, which would have meant the preview was
    // lying about a shipped card. IT DOES NOT. The user answered "i meant to
    // add stopping and resuming tap as a feature" (11-09-ANSWERS.md): they
    // were describing what they want, not what they saw. The simulator was
    // never wrong, and this test is the feature rather than the repair.
    //
    // THE ASSERTION IS A SEQUENCE, NOT A COUNT, and the flat stretch is pinned
    // BY ITS LENGTH. A toggle that fired on the DOWN and again on the UP of
    // one press would stop and resume inside one gesture and look exactly like
    // a card that does nothing; a test that counted messages would go green on
    // it, which is 11-08's lesson in its own words. A one-sample plateau
    // therefore cannot pass here - the whole wait has to be flat.
    //
    // BOTH ARRIVAL SHAPES ARE DRIVEN, and that is the point of the plan. A
    // deliberate press arrives as DOWN then UP; a sub-cycle one arrives as the
    // single coalesced DOWNUP, code 9, which 11-02 admitted as a real press.
    // Measured on the shipped src/lib/sim/touch.ts, the BROWSER never produces
    // 9 at all - a 300 ms press and the fastest press a pointer can make both
    // deliver 4 then 5 - so code 9 reaches an entry from HARDWARE only and has
    // to be synthesised to be tested. Both are, and both must toggle once.
    const entry = entryById("arc");
    const cc = knobValueOf(entry, "cc");
    // The centre cell of the 3x3 heart, from the entry's own paint loop.
    const CENTRE_CELL = 40;
    const cellOf = (x: number, y: number): number =>
      Math.floor((x * 9) / 128) + Math.floor((y * 9) / 128) * 9;
    // One second. ARC's Timer is gtt(0,20) against a 10 ms tick, so it runs
    // half as often as the host ticks.
    const WAIT_TICKS = 100;
    const TIMER_RUNS = WAIT_TICKS / 2;
    const report: string[] = [];

    for (const mode of ["slow: DOWN then UP", "fast: coalesced DOWNUP"]) {
      const { host, sim } = await open(entry);
      try {
        const emitted = (from: number): number[] =>
          host.midi
            .slice(from)
            .filter((m) => m.p1 === cc)
            .map((m) => m.p2);
        // The swirl's rate is the visible half: a stopped ARC has to LOOK
        // stopped, not merely go quiet.
        const swirlRate = (): number => sim.layer(screenToHw(0, 0), 2).fre;

        let nth = 0;
        const tapCentre = (): void => {
          // The host's enqueue is change-gated on (event, x, y) per contact,
          // so two identical taps at one pixel would measure the HOST's dedup
          // and report it as the entry's. Both points are inside cell 40.
          const p = 60 + nth * 5;
          nth += 1;
          expect(
            cellOf(p, p),
            `arc: the probe must press the centre cell, not near it`,
          ).toBe(CENTRE_CELL);
          if (mode.startsWith("fast")) {
            host.touchTap(0, p, p);
            host.tick();
          } else {
            host.touchDown(0, p, p);
            host.tick();
            host.touchUp(0, p, p);
            host.tick();
          }
        };

        let from = host.midi.length;
        host.run(WAIT_TICKS);
        const running = emitted(from);

        tapCentre();
        const stoppedRate = swirlRate();
        from = host.midi.length;
        host.run(WAIT_TICKS);
        const stopped = emitted(from);

        tapCentre();
        const resumedRate = swirlRate();
        from = host.midi.length;
        host.run(WAIT_TICKS);
        const resumed = emitted(from);

        const shape = (v: number[]): string =>
          `${v.length} msg, ${new Set(v).size} distinct, ` +
          `${v.length > 0 ? Math.min(...v) : 0}..` +
          `${v.length > 0 ? Math.max(...v) : 0}`;
        report.push(
          `${mode.padEnd(22)} running [${shape(running)}] -> stopped ` +
            `[${shape(stopped)}] -> resumed [${shape(resumed)}]; swirl rate ` +
            `${stoppedRate} while stopped, ${resumedRate} after`,
        );

        // NON-VACUITY FIRST. A run that emitted nothing would satisfy "flat"
        // for free, and a Timer that raised would emit nothing either.
        for (const [label, run] of [
          ["before the first tap", running],
          ["while stopped", stopped],
          ["after the second tap", resumed],
        ] as const)
          expect(
            run.length,
            `arc ${mode}: the Timer sent no controller at all ${label}, so ` +
              "nothing below proves anything. ARC KEEPS SENDING WHILE " +
              "STOPPED, deliberately: a stop that went silent would be " +
              "indistinguishable from a Timer that raised",
          ).toBeGreaterThan(TIMER_RUNS - 4);

        expect(
          new Set(running).size,
          "arc: the controller must be moving before the first tap, or the " +
            "flat stretch below is comparing two still pictures",
        ).toBeGreaterThan(1);

        // 1. THE STOP, PINNED BY LENGTH AS WELL AS BY CONSTANCY. This is the
        //    clause that a toggle firing twice inside one gesture cannot pass:
        //    such a card never flattens at all.
        expect(
          new Set(stopped).size,
          `arc ${mode}: ONE TAP MUST BE ONE TOGGLE. The centre was tapped ` +
            `once and the controller went on moving - ${stopped.length} ` +
            `message(s) over ${TIMER_RUNS} Timer runs taking ` +
            `${new Set(stopped).size} distinct values. A toggle that fires ` +
            "on the down AND on the up of one press stops and resumes inside " +
            "the same gesture, which looks exactly like a card that does " +
            "nothing. The onset edge is e==4 or e>8 - see stage.ts",
        ).toBe(1);
        expect(
          stopped.length,
          `arc ${mode}: the stop must hold for the WHOLE wait, not for one ` +
            `sample. ${TIMER_RUNS} Timer runs elapsed and only ` +
            `${stopped.length} message(s) arrived`,
        ).toBeGreaterThan(TIMER_RUNS - 4);

        // 2. THE RESUME. The next tap has to give the movement back, and this
        //    is the half that a stop written as s.r = 0 fails: the touch
        //    handler recomputes r = 1 + x*31//127 on every accepted sample, so
        //    a zeroed rate is revived by the very touch meant to resume it.
        expect(
          new Set(resumed).size,
          `arc ${mode}: THE SECOND TAP MUST RESUME. After it the controller ` +
            `took ${new Set(resumed).size} distinct value(s) over ` +
            `${resumed.length} message(s)`,
        ).toBeGreaterThan(1);

        // 3. THE STOP IS VISIBLE. "not intuitive enough" arrives by a second
        //    route if a user has to wait and listen to find out whether the
        //    card stopped. Layer 2 is the whole-pad swirl and glf is a
        //    rate-only setter, so rate 0 freezes the picture without blanking
        //    it - measured, the brightest frozen cell is 253 of 255.
        expect(
          stoppedRate,
          `arc ${mode}: A STOPPED ARC MUST LOOK STOPPED. The swirl's rate is ` +
            `${stoppedRate}; a card whose only sign of life is the MIDI it ` +
            "is not sending is the 'not intuitive enough' the bench note " +
            "complained about, arriving by another route",
        ).toBe(0);
        expect(
          resumedRate,
          `arc ${mode}: the swirl must turn again after the resume. Rate ` +
            `${resumedRate}`,
        ).toBeGreaterThan(0);
      } finally {
        host.close();
      }
    }

    // 4. THE TOGGLE IS ON THE ONSET EDGE ONLY. A finger that presses outside
    //    the centre and DRAGS THROUGH it is setting the rate, not tapping, so
    //    the card must keep running - which is also what shrinks the hole the
    //    centre cell leaves in the mapping to "a press that STARTS there".
    {
      const { host, sim } = await open(entry);
      try {
        host.touchDown(0, 10, 64);
        host.tick();
        for (let x = 11; x <= 120; x += 1) {
          host.touchMove(0, x, 64);
          host.tick();
        }
        host.touchUp(0, 120, 64);
        host.tick();
        const from = host.midi.length;
        host.run(WAIT_TICKS);
        const values = host.midi
          .slice(from)
          .filter((m) => m.p1 === cc)
          .map((m) => m.p2);
        const rate = sim.layer(screenToHw(0, 0), 2).fre;
        report.push(
          `drag THROUGH the centre: swirl rate ${rate}, ` +
            `${values.length} msg, ${new Set(values).size} distinct`,
        );
        expect(
          new Set(values).size,
          "arc: A DRAG THROUGH THE CENTRE MUST NOT STOP THE CARD. The " +
            "toggle fires on the onset edge (e==4 or e>8) only; a MOVE " +
            "sample over cell 40 sets the rate and the depth like any other. " +
            `Observed ${new Set(values).size} distinct value(s) after the drag`,
        ).toBeGreaterThan(1);
        expect(
          rate,
          "arc: the swirl must still be turning after a drag that crossed " +
            "the centre",
        ).toBeGreaterThan(0);
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nARC stop/resume, plan 11-09.1:\n  " + report.join("\n  ") + "\n",
    );
    expect(report.length, "both tap shapes and the drag reported").toBe(3);
  }, 120000);

  it("shows STAGE's live, lined-up and idle zones as THREE states", async () => {
    // THE BENCH NOTE THIS ANSWERS: "Lining up breathing is missing" (plan
    // 11-09), and the answer was "implement breathing as planned".
    //
    // WHAT THE MEASUREMENT FOUND IS THE INTERESTING HALF. The breathing state
    // was never broken: src/lib/catalog/listing.ts has promised it since phase
    // 9 - "the live one glows and the one you are lining up breathes" - while
    // stage.ts carried only LIVE (rate 4) and UNDER A FINGER (rate 24). It was
    // described, shipped in the copy, and never built.
    //
    // THE ASSERTION IS DISTINGUISHABILITY, NOT A RATE LITERAL. Every claim
    // below is about how the four watched zones DIFFER from one another in the
    // rendered frame, so re-tuning any rate keeps this green and only a
    // COLLAPSE - two states that render the same - turns it red. Three states
    // that look like two is the bug the user reported in the first place.
    const entry = entryById("stage");
    // The window is long enough for the slowest state to complete several
    // cycles: the phase advances by the rate every tick and wraps at 256, so
    // the slowest rate any of these states could sensibly carry still turns
    // over inside it.
    const WINDOW = 512;
    // How much faster one state's cycle count must be than another's before
    // the two read as different states at arm's length. A LEGIBILITY claim, not
    // a rate: two zones whose breathe differs by a few per cent are two zones
    // an operator sees as one state. 1.5 is also comfortably outside the
    // one-cycle window-alignment artefact a fixed sample window produces.
    const SEPARATION = 1.5;

    // The zones, from the entry's own arithmetic: zone z has zone-row z//3 and
    // zone-column z%3, its top-left cell is z//3*27 + z%3*3, and its four
    // corners are that cell plus 0, 2, 18 and 20.
    const cornersOf = (z: number): number[] => {
      const r = Math.floor(z / 3) * 27 + (z % 3) * 3;
      return [0, 2, 18, 20].map((offset) => r + offset);
    };
    // A finger's zone is x*3//128 + y*3//128*3, so a third of 128 is 42.67 and
    // the middle of zone-column c is c*128//3 + 21.
    const centreOf = (z: number): [number, number] => [
      Math.floor(((z % 3) * 128) / 3) + 21,
      Math.floor((Math.floor(z / 3) * 128) / 3) + 21,
    ];
    const brightnessOf = (frame: Uint8Array, cell: number): number =>
      frame[cell * 3] + frame[cell * 3 + 1] + frame[cell * 3 + 2];

    type Trace = { floor: number; ceil: number; swing: number; cycles: number };
    const traceOf = (series: readonly number[]): Trace => {
      const floor = Math.min(...series);
      const ceil = Math.max(...series);
      const mid = (floor + ceil) / 2;
      let cycles = 0;
      for (let i = 1; i < series.length; i += 1)
        if (series[i - 1] <= mid && series[i] > mid) cycles += 1;
      return { floor, ceil, swing: ceil - floor, cycles };
    };

    // LIVE starts on zone 0. The gesture cuts to the CENTRE zone and then lines
    // up the BOTTOM-RIGHT one, leaving the TOP-RIGHT one untouched as the idle
    // control.
    const CUT_TO = 4;
    const LINE_UP = 8;
    const IDLE = 2;
    const WATCHED = [CUT_TO, LINE_UP, IDLE];
    expect(
      new Set(WATCHED).size,
      "the three watched zones are three different zones",
    ).toBe(3);

    const { host } = await open(entry);
    const report: string[] = [];
    try {
      const collect = (): Map<number, Trace> => {
        const series = new Map<number, number[]>();
        for (const z of WATCHED) series.set(z, []);
        for (let t = 0; t < WINDOW; t += 1) {
          host.tick();
          for (const z of WATCHED) {
            const cells = cornersOf(z);
            let total = 0;
            for (const cell of cells) total += brightnessOf(host.frame, cell);
            (series.get(z) as number[]).push(total);
          }
        }
        const out = new Map<number, Trace>();
        for (const z of WATCHED) out.set(z, traceOf(series.get(z) as number[]));
        return out;
      };
      const say = (label: string, traces: Map<number, Trace>): void => {
        report.push(
          `${label.padEnd(24)} ` +
            WATCHED.map((z) => {
              const t = traces.get(z) as Trace;
              return `zone ${z}: floor ${t.floor} ceil ${t.ceil} cycles ${t.cycles}`;
            }).join("  |  "),
        );
      };

      // 1. THE GESTURE. A press cuts, exactly as it always has; the finger then
      //    SLIDES to another zone, which lines that zone up. The slide is the
      //    selection, and it is the one gesture on a nine-zone pad with no
      //    modifier key that costs the cut nothing - see stage.ts's header for
      //    the two that were rejected and why.
      const [cutX, cutY] = centreOf(CUT_TO);
      host.touchDown(0, cutX, cutY);
      host.tick();
      const hidAfterCut = host.hid.length;
      const [upX, upY] = centreOf(LINE_UP);
      host.touchMove(0, upX, upY);
      host.tick();

      // 2. LINING UP MUST NOT GO ON AIR. The whole point of a preview scene is
      //    that the audience does not see it, so the slide must send NO
      //    keystroke at all. A "line up" that also cuts is worse than no
      //    feature.
      expect(
        host.hid.length,
        `stage: SLIDING ONTO A ZONE MUST NOT CUT TO IT. The press sent ` +
          `${hidAfterCut} keystroke(s) and the slide onto zone ${LINE_UP} ` +
          `took the total to ${host.hid.length}. A scene you are lining up ` +
          "is one the audience must not see",
      ).toBe(hidAfterCut);

      // 3. WITH THE FINGER STILL DOWN: the live zone is under the hand, the
      //    lined-up zone is breathing at its own rate, the idle zone is still.
      const held = collect();
      say("finger down, slid over", held);

      host.touchUp(0, upX, upY);
      host.tick();

      // 4. AFTER THE LIFT: the live zone settles to its slow breathe and the
      //    lined-up zone keeps its own. This is the state an operator actually
      //    looks at, and it is the pair that has to read as two things.
      const rest = collect();
      say("after the lift", rest);

      const idle = rest.get(IDLE) as Trace;
      const preview = rest.get(LINE_UP) as Trace;
      const live = rest.get(CUT_TO) as Trace;
      const under = held.get(CUT_TO) as Trace;

      // 5. NON-VACUITY. A run in which nothing lit at all would satisfy every
      //    "these differ" clause below by comparing three zeros.
      expect(
        idle.floor,
        `stage: the idle zone ${IDLE} rendered black, so the comparisons ` +
          "below are being made against nothing. Setup paints nine idle boxes",
      ).toBeGreaterThan(0);

      // 6. THE IDLE ZONE IS STILL, AND THE OTHER THREE ARE NOT. This is what
      //    separates "a scene" from "a scene doing something".
      expect(
        idle.swing,
        `stage: zone ${IDLE} was never touched and must not move. Observed ` +
          `floor ${idle.floor}, ceil ${idle.ceil}`,
      ).toBe(0);
      for (const [label, trace] of [
        ["the live zone", live],
        ["the lined-up zone", preview],
        ["the zone under the finger", under],
      ] as const)
        expect(
          trace.swing,
          `stage: ${label} rendered a constant ${trace.floor} across ` +
            `${WINDOW} ticks. All three of STAGE's active states breathe; a ` +
            "still one is a state that has collapsed into the idle box",
        ).toBeGreaterThan(0);

      // 7. THE LINED-UP ZONE SITS ON THE IDLE BASE, AND THE LIVE ZONE DOES
      //    NOT. This is the second axis, and it is the one that says "not on
      //    air": the previewed box keeps the dim idle colour underneath and
      //    only pulses the live colour through it, while the live box carries
      //    the live colour underneath as well.
      expect(
        preview.floor,
        `stage: the lined-up zone ${LINE_UP} must rest on the SAME base the ` +
          `idle zones do - it is not on air. Observed ${preview.floor} ` +
          `against the idle ${idle.floor}`,
      ).toBe(idle.floor);
      expect(
        live.floor,
        `stage: the live zone ${CUT_TO} must rest on a BRIGHTER base than ` +
          `the lined-up zone ${LINE_UP}, or the two read as the same state ` +
          `between pulses. Observed ${live.floor} against ${preview.floor}`,
      ).toBeGreaterThan(preview.floor);

      // 8. THE THREE RATES ARE THREE RATES, PAIRWISE. Cycle counts rather than
      //    the rates themselves, so this is a claim about what the pad LOOKS
      //    like and not about what the source says.
      const rates = [
        [`the live zone ${CUT_TO} at rest`, live],
        [`the lined-up zone ${LINE_UP}`, preview],
        [`the zone ${CUT_TO} under the finger`, under],
      ] as const;
      for (let i = 0; i < rates.length; i += 1) {
        expect(
          rates[i][1].cycles,
          `stage: ${rates[i][0]} completed no full cycle in ${WINDOW} ticks, ` +
            "so its rate cannot be compared with anything",
        ).toBeGreaterThan(0);
        for (let j = i + 1; j < rates.length; j += 1) {
          const a = rates[i][1].cycles;
          const b = rates[j][1].cycles;
          expect(
            Math.max(a, b) / Math.min(a, b),
            `stage: THREE STATES THAT LOOK LIKE TWO IS THE BUG. ` +
              `${rates[i][0]} breathed ${a} time(s) in ${WINDOW} ticks and ` +
              `${rates[j][0]} breathed ${b} - too close to read as different ` +
              "states at arm's length. Separate the rates; do not relax this",
          ).toBeGreaterThanOrEqual(SEPARATION);
        }
      }
    } finally {
      host.close();
    }

    process.stdout.write(
      "\nSTAGE's three zone states, plan 11-09:\n  " +
        report.join("\n  ") +
        "\n",
    );
    expect(report.length, "both halves of the gesture reported").toBe(2);
  }, 120000);

  it("carries LUMEN's depth knob all the way to the emitted bytes, downwards, and only below the top row", async () => {
    // THE BENCH NOTE THIS ANSWERS: "LUMEN ... the color depth / opacity doesn't
    // work", answered at the 11-09 checkpoint with "try it but we observed no
    // difference in the LEDs".
    //
    // THE OPTION THAT NOTE WAS COSTED FROM SAID DEPTH MOVES THE ANCHOR FROM 78
    // PER CENT TO 11 PER CENT. That figure is the arithmetic d/36 and it is NOT
    // a reading of a frame: between it and a lit LED sit glc's three colour
    // stops, glp's phase, shapeIntensity, the per-layer weights, the two-layer
    // sum and the single divide by 512 with its clamp at 255
    // (pad-sim.ts render()). So this test reads the FRAME.
    //
    // WHAT IT FOUND, and it is why nothing was deepened on the strength of the
    // note: the knob delivers. Four @DEPTH values render four distinct 243-byte
    // frames. Column 0's bottom row walks 196,69,0 -> 139,49,0 -> 84,29,0 ->
    // 27,9,0, which is 77 per cent of the emitted anchor down to 11 per cent of
    // it - the costed ratio, confirmed in bytes.
    //
    // AND WHY "NO DIFFERENCE IN THE LEDS" IS STILL CONSISTENT WITH THAT. The
    // whole of the knob's travel is in the LOWER rows. d = 36 - row*@DEPTH, so
    // ROW 0 IS d = 36 AT EVERY VALUE AND CANNOT MOVE - that is arithmetic, not
    // a defect - and the worst channel spread across all four values climbs
    // 0, 21, 42, 63, 85, 105, 126, 148, 169 from row 0 to row 8. The shipped
    // default is index 2 of 4, so ONE STEP moves row 1 by seven counts of 255
    // and the bottom row by fifty-five. A person watching the top of the pad
    // while turning the knob is reporting what the pad does.
    //
    // ASSERTED AS RELATIONS, NEVER AS BRIGHTNESS LITERALS, so a future re-cut
    // of the four values or of the divisor survives this test and only a
    // DECOUPLING - or an inversion - reddens it. Clause 5 is the shortfall this
    // wave found made permanent: 8*max(@DEPTH) has to stay inside the
    // subtrahend or the bottom row goes negative and truncates to garbage, so
    // @DEPTH's four values ARE the whole legal travel and there is no deeper
    // re-cut available at the current arithmetic. It reddens the day someone
    // widens one without the other.
    const entry = entryById("lumen");
    const knob = entry.knobs.find((k) => k.id === "depth");
    expect(knob, "lumen declares a depth knob").toBeDefined();
    const values = knob!.values;
    // LUMEN's Setup paints once and its Timer is the empty string, so the
    // picture is settled the moment Setup returns. Five ticks is the same
    // sample frames.spec.ts takes, and a picture that moved between tick 0 and
    // tick 5 would be a decay this entry is not supposed to have.
    const SAMPLE_TICKS = 5;
    const GRID_W = 9;

    const frames: Uint8Array[] = [];
    for (let i = 0; i < values.length; i += 1) {
      const { setup, timer } = renderLua(entry, { depth: i });
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        setup,
        timer: timer.trim() === "" ? undefined : timer,
      });
      try {
        for (let t = 0; t < SAMPLE_TICKS; t += 1) host.tick();
        expect(
          host.errors,
          `lumen at @DEPTH ${values[i]}: the configuration must run clean`,
        ).toEqual([]);
        frames.push(Uint8Array.from(host.frame));
      } finally {
        host.close();
      }
    }

    const channelAt = (
      frame: Uint8Array,
      col: number,
      row: number,
      ch: number,
    ): number => frame[(col + row * GRID_W) * 3 + ch];
    const tripleAt = (frame: Uint8Array, col: number, row: number): string =>
      rgbAt(frame, col + row * GRID_W);
    const CHANNELS = ["r", "g", "b"] as const;

    // 1. ROW 0 CANNOT MOVE, AND THAT IS ARITHMETIC. d = 36 - 0*@DEPTH = 36 at
    //    every value of the knob, so the top row is the anchor colour whatever
    //    the knob says. Stated out loud because a user looking at the top of
    //    the pad while turning the knob would correctly report seeing nothing.
    for (let col = 0; col < GRID_W; col += 1) {
      const seen = new Set(frames.map((f) => tripleAt(f, col, 0)));
      expect(
        [...seen],
        `lumen: ROW 0 IS THE ANCHOR AT EVERY @DEPTH - d = 36 - 0*@DEPTH is ` +
          `36 for all of ${values.join(", ")}. Column ${col} row 0 rendered ` +
          `${[...seen].join(" and ")}`,
      ).toHaveLength(1);
    }

    // 2. THE BOTTOM ROW IS STRICTLY MONOTONIC IN THE KNOB INDEX, PER CHANNEL,
    //    AND IT GOES DOWN. LUMEN's header promises "A LARGER @DEPTH IS A DEEPER
    //    RAMP, which is the way round the label reads"; this is that sentence
    //    under test. A channel whose ANCHOR is zero - eight of the nine columns
    //    are a pure hue and so have one - is zero at every row and every value,
    //    and is skipped by reading row 0 rather than by a list of columns.
    const BOTTOM = GRID_W - 1;
    let checked = 0;
    let anchored = 0;
    for (let col = 0; col < GRID_W; col += 1) {
      for (let ch = 0; ch < CHANNELS.length; ch += 1) {
        if (channelAt(frames[0], col, 0, ch) === 0) continue;
        anchored += 1;
        const series = frames.map((f) => channelAt(f, col, BOTTOM, ch));
        const observed = frames
          .map((f, i) => `@DEPTH ${values[i]} ${tripleAt(f, col, BOTTOM)}`)
          .join(", ");
        for (let i = 1; i < series.length; i += 1) {
          expect(
            series[i],
            `lumen: THE DEPTH KNOB MUST REACH THE EMITTED BYTES AND MUST ` +
              `DARKEN. Column ${col}, row ${BOTTOM}, channel ` +
              `${CHANNELS[ch]}: @DEPTH ${values[i]} emitted ${series[i]} ` +
              `where @DEPTH ${values[i - 1]} emitted ${series[i - 1]}. ` +
              `The whole row reads ${observed}`,
          ).toBeLessThan(series[i - 1]);
          checked += 1;
        }
      }
    }
    // NON-VACUITY, DERIVED RATHER THAN TYPED. Every channel that is non-zero on
    // row 0 is non-zero on every row - the ramp scales, it does not mask - so
    // the count of anchored channels IS the count the loop above must have
    // walked. A plant that blacked the pad out would reach here with zero.
    expect(
      anchored,
      "lumen: the bottom-row sweep walked no channel at all, so its " +
        "monotonicity claim is vacuous",
    ).toBeGreaterThan(0);
    expect(
      checked,
      `lumen: the sweep must compare every one of the ${anchored} anchored ` +
        `channels across all ${values.length} declared @DEPTH values`,
    ).toBe(anchored * (values.length - 1));

    // 3. THE KNOB'S TRAVEL LIVES IN THE LOWER ROWS, AND THAT IS THE ANSWER TO
    //    THE BENCH NOTE. The spread a row shows across the four values is zero
    //    at the top and grows with every row down. Asserted as a strict
    //    ordering between rows, so re-cutting the values keeps it green.
    const spreadOf = (row: number): number => {
      let worst = 0;
      for (let col = 0; col < GRID_W; col += 1)
        for (let ch = 0; ch < CHANNELS.length; ch += 1) {
          const vals = frames.map((f) => channelAt(f, col, row, ch));
          worst = Math.max(worst, Math.max(...vals) - Math.min(...vals));
        }
      return worst;
    };
    const spreads = Array.from({ length: GRID_W }, (_, row) => spreadOf(row));
    expect(
      spreads[0],
      `lumen: row 0 must not move at all across ${values.join(", ")}; the ` +
        `nine rows spread ${spreads.join(", ")}`,
    ).toBe(0);
    for (let row = 1; row < GRID_W; row += 1) {
      expect(
        spreads[row],
        `lumen: EVERY ROW DOWN MUST MOVE MORE THAN THE ONE ABOVE IT, because ` +
          `d = 36 - row*@DEPTH. Row ${row} spread ${spreads[row]} against ` +
          `row ${row - 1}'s ${spreads[row - 1]}; the nine rows spread ` +
          spreads.join(", "),
      ).toBeGreaterThan(spreads[row - 1]);
    }

    // 4. THE SHORTFALL, PINNED TO THE SOURCE RATHER THAN TO THIS WAVE'S PROSE.
    //    Read the subtrahend and the channel divisor out of the entry's own
    //    Lua. They must be the same number, or row 0 stops being the anchor;
    //    8*max(@DEPTH) must not exceed the subtrahend, or the bottom row goes
    //    NEGATIVE and a colour channel truncates rather than clamping; and the
    //    largest declared value must already be the largest the arithmetic
    //    admits, which is why the answer to "deepen the ramp" is that there is
    //    no deeper four-value re-cut to make.
    const template = (entry.source as { setup: string }).setup;
    const ramp = /d=(\d+)-n\/\/9\*@DEPTH/.exec(template);
    const scale = /\*d\/\/(\d+)/.exec(template);
    expect(
      ramp,
      `lumen: the depth ramp must still read d=<N>-n//9*@DEPTH`,
    ).not.toBeNull();
    expect(
      scale,
      "lumen: the channel scale must still read *d//<N>",
    ).not.toBeNull();
    const subtrahend = Number(ramp![1]);
    const divisor = Number(scale![1]);
    expect(
      divisor,
      `lumen: the subtrahend (${subtrahend}) and the channel divisor ` +
        `(${divisor}) must be the same number, or row 0 is no longer the ` +
        "anchor colour exactly and the card's whole claim goes with it",
    ).toBe(subtrahend);
    const deepest = Math.max(...values.map(Number));
    expect(
      (GRID_W - 1) * deepest,
      `lumen: 8*max(@DEPTH) = ${(GRID_W - 1) * deepest} must stay inside the ` +
        `subtrahend ${subtrahend}, or the bottom row's d goes negative and a ` +
        "channel TRUNCATES rather than clamping. The obvious alternative " +
        "form, anchor*(@DEPTH-row)//@DEPTH, is negative at @DEPTH 6 and " +
        "exactly black at 8 - see the entry header",
    ).toBeLessThanOrEqual(subtrahend);
    expect(
      (GRID_W - 1) * (deepest + 1),
      `lumen: @DEPTH's declared values ${values.join(", ")} ARE the whole ` +
        `legal travel at subtrahend ${subtrahend} - ${deepest} is the ` +
        "deepest integer the arithmetic admits, so there is no deeper " +
        "re-cut. Widening one without the other is what this reddens on",
    ).toBeGreaterThan(subtrahend);

    // The nine-row table, printed so the measurement is in the run and not
    // only in the entry header. Column 0 is the anchor 255,90,0 - a pure hue
    // with a zero channel - and column 8 is the amber white 255,230,190, the
    // only three-channel column; they truncate differently and both are shown.
    const table = [0, GRID_W - 1].map((col) => {
      const rows = Array.from(
        { length: GRID_W },
        (_, row) =>
          `    row ${row}  ` +
          frames.map((f) => tripleAt(f, col, row).padEnd(14)).join(" "),
      );
      return (
        `  column ${col}, @DEPTH ${values.join(" / ")}\n` + rows.join("\n")
      );
    });
    process.stdout.write(
      "\nLUMEN depth to emitted bytes, plan 11-09.2:\n" +
        table.join("\n") +
        `\n  row spreads across all four values: ${spreads.join(", ")}\n`,
    );
  }, 120000);

  it("sends LUMEN's colour as framed seven-bit hex over sysex, once per colour", async () => {
    // THE BENCH NOTE THIS ANSWERS: "LUMEN: should send HEX in sysex".
    //
    // The call is `gmss`, midi_sysex_send. Every argument is ONE PAYLOAD BYTE
    // and the CONFIGURATION supplies 0xF0 and 0xF7 itself (`grid_lua_api.c:
    // 905-935`, read through `../zona-docs/docs/ZONA_REFERENCE.md:1241` and
    // `:2022`). Plan 11-10 added `gmss` to the host's sixteen globals so this
    // entry could be PREVIEWED rather than raising in its own catalog card;
    // `lua-host.spec.ts` proves the name reaches the recorder, and this test
    // proves the ENTRY produces a correctly framed message - a different claim
    // about a different file.
    //
    // WHY ASCII HEX AND NOT RAW RGB, ASSERTED RATHER THAN ARGUED. Sysex data
    // bytes are SEVEN-BIT: a byte with the high bit set is a status byte and
    // ends the message where it stands. Row 0 of this pad is the anchor colour
    // EXACTLY, so the first cell a visitor touches has a channel of 255 - which
    // a raw three-byte payload could not carry. Clause 4 below asserts both
    // halves of that: the asked colour really does exceed 127, and every byte
    // that actually goes out really is inside it.
    //
    // NOTHING IN HANGAR VALIDATES SEVEN-BIT SYSEX DATA. The host records what
    // the configuration asked to send, unmasked and unchecked, on purpose
    // (lua-host.ts, recordSysex), and the vendored trap scanner does not know
    // `gmss` at all - it is absent from `_pad.ts`'s OUT_CALLS. Clause 4 IS the
    // check, and it covers this entry only. A second sysex entry needs its own.
    const entry = entryById("lumen");
    const { setup, timer } = renderLua(entry);
    const GRID_W = 9;

    // THE EXPECTED COLOUR IS DERIVED FROM THE ENTRY'S OWN LUA, never restated,
    // so a future re-cut of the palette or of the ramp survives this test and
    // only a broken ENCODING reddens it. Same parse the depth test above uses.
    const anchors = /local H=\{([0-9,]+)\}/.exec(setup);
    const ramp = /d=(\d+)-n\/\/9\*(\d+)/.exec(setup);
    const scale = /\*d\/\/(\d+)/.exec(setup);
    expect(
      anchors,
      "lumen: the anchor table must still read local H={...}",
    ).not.toBeNull();
    expect(
      ramp,
      "lumen: the depth ramp must still read d=<N>-n//9*<D>",
    ).not.toBeNull();
    expect(
      scale,
      "lumen: the channel scale must still read *d//<N>",
    ).not.toBeNull();
    const H = anchors![1].split(",").map(Number);
    expect(
      H,
      "lumen: the anchor table is three channels per column",
    ).toHaveLength(GRID_W * 3);
    const subtrahend = Number(ramp![1]);
    const depth = Number(ramp![2]);
    const divisor = Number(scale![1]);

    /** The colour the configuration ASKS for at a cell - not the emitted byte. */
    const askedAt = (col: number, row: number): number[] => {
      const d = subtrahend - row * depth;
      return [0, 1, 2].map((k) => Math.floor((H[col * 3 + k] * d) / divisor));
    };

    // The encoder under test, restated here as the INVERSE: this test reads
    // the six digits back to a number, so it never has to know '0'..'9' and
    // 'A'..'F' as two magic constants twice.
    const HEX = "0123456789ABCDEF";
    const decode = (bytes: readonly number[]): number[] => {
      const digits = bytes.map((b) => HEX.indexOf(String.fromCharCode(b)));
      return [0, 1, 2].map((k) => digits[k * 2] * 16 + digits[k * 2 + 1]);
    };

    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      setup,
      timer: timer.trim() === "" ? undefined : timer,
    });
    const seen: { label: string; bytes: number[] }[] = [];
    try {
      expect(host.errors, "lumen: Setup must run clean").toEqual([]);
      expect(
        host.sysex,
        "lumen: Setup alone must send nothing - a card that talks before it " +
          "is touched is a card that talks on every page load",
      ).toEqual([]);

      // 1. A PRESS ON THE TOP-LEFT CELL. Row 0, column 0: the anchor colour
      //    exactly, and the one cell whose channels are largest.
      const c0 = cellCentre(0);
      const c8 = cellCentre(GRID_W - 1);
      host.touchDown(0, c0, c0);
      host.tick();
      seen.push({
        label: "press on cell 0",
        bytes: [...(host.sysex.at(-1)?.bytes ?? [])],
      });

      // 2. A MOVE THAT STAYS INSIDE THE SAME CELL SENDS NOTHING. The colour did
      //    not change, so neither did the message - this is the whole reason
      //    the send sits inside the cursor's own change gate rather than beside
      //    the two controllers, which do fire on every sample.
      const beforeIdleMove = host.sysex.length;
      host.touchMove(0, c0 + 1, c0 + 1);
      host.tick();
      const afterIdleMove = host.sysex.length;

      // 3. A MOVE TO ANOTHER CELL SENDS THAT CELL'S COLOUR.
      host.touchMove(0, c8, c8);
      host.tick();
      seen.push({
        label: "move to cell 80",
        bytes: [...(host.sysex.at(-1)?.bytes ?? [])],
      });

      // 4. A FRESH CONTACT ON THE CELL ALREADY UNDER THE CURSOR SENDS AGAIN.
      //    `if n~=s.c or e>3` - e above 3 inside the shipped filter is a press
      //    or a fast tap. Without the second half a desk that missed the first
      //    message would need the finger to move to another cell and back.
      host.touchUp(0, c8, c8);
      host.tick();
      host.touchDown(0, c8, c8);
      host.tick();
      seen.push({
        label: "press again on cell 80",
        bytes: [...(host.sysex.at(-1)?.bytes ?? [])],
      });

      expect(host.errors, "lumen: the gesture must run clean").toEqual([]);
      expect(
        afterIdleMove,
        "lumen: a move inside one cell re-sent the colour, so the send is no " +
          "longer gated on the cursor changing",
      ).toBe(beforeIdleMove);
      expect(
        host.sysex.length,
        `lumen: expected three sysex messages from this gesture, saw ` +
          `${host.sysex.length}`,
      ).toBe(3);

      // CLAUSE 1 - THE FRAMING, ASSERTED EXPLICITLY ON EVERY MESSAGE. It is the
      // part a later edit is most likely to drop, and firmware WARNS and
      // transmits anyway rather than refusing (grid_decode.c:96-100), so a
      // dropped terminator would ship silently.
      for (const message of seen) {
        expect(
          message.bytes[0],
          `lumen/${message.label}: a sysex message must OPEN with 0xF0, and ` +
            `this configuration supplies it - got ${message.bytes[0]}`,
        ).toBe(0xf0);
        expect(
          message.bytes.at(-1),
          `lumen/${message.label}: a sysex message must END with 0xF7, and ` +
            `this configuration supplies it - got ${message.bytes.at(-1)}`,
        ).toBe(0xf7);
        expect(
          message.bytes.length,
          `lumen/${message.label}: 0xF0, a manufacturer id, six hex digits ` +
            `and 0xF7 is nine bytes; got ${message.bytes.length}: ` +
            message.bytes.join(", "),
        ).toBe(9);
      }

      // CLAUSE 2 - THE PAYLOAD IS THE COLOUR UNDER THE FINGER, decoded back
      // from its six digits and compared against the entry's own arithmetic.
      const expected: number[][] = [
        askedAt(0, 0),
        askedAt(GRID_W - 1, GRID_W - 1),
        askedAt(GRID_W - 1, GRID_W - 1),
      ];
      for (let i = 0; i < seen.length; i += 1) {
        const digits = seen[i].bytes.slice(2, 8);
        expect(
          decode(digits),
          `lumen/${seen[i].label}: the six digits ` +
            `"${digits.map((b) => String.fromCharCode(b)).join("")}" decode ` +
            `to ${decode(digits).join(",")}, and the cell's colour is ` +
            `${expected[i].join(",")}`,
        ).toEqual(expected[i]);
      }

      // CLAUSE 3 - THE SAME CELL SENDS THE SAME MESSAGE. Messages 2 and 3 are
      // the same cell reached two different ways, so any difference between
      // them is state leaking into the payload.
      expect(
        seen[2].bytes,
        "lumen: the same cell sent two different messages",
      ).toEqual(seen[1].bytes);
      expect(
        seen[0].bytes,
        "lumen: two different cells sent the same message, so the payload is " +
          "not reading the cell",
      ).not.toEqual(seen[1].bytes);

      // CLAUSE 4 - SEVEN BITS, AND THE REASON THE ENCODING IS NOT RAW RGB.
      // Nothing else in the tree checks this: not the host, which records
      // unmasked on purpose, and not the vendored trap scanner, which has never
      // heard of gmss.
      const anchor = askedAt(0, 0);
      expect(
        Math.max(...anchor),
        `lumen: the top-left cell asks for ${anchor.join(",")}, and if its ` +
          "largest channel were inside 127 this clause would be vacuous - a " +
          "raw RGB payload would then have been legal and 86 characters cheaper",
      ).toBeGreaterThan(0x7f);
      for (const message of seen) {
        for (let at = 1; at < message.bytes.length - 1; at += 1) {
          expect(
            message.bytes[at],
            `lumen/${message.label}: byte ${at} is ${message.bytes[at]}, and ` +
              "a sysex DATA byte above 127 is a status byte - it would end " +
              `the message where it stands. Whole message: ` +
              message.bytes.join(", "),
          ).toBeLessThanOrEqual(0x7f);
          expect(
            message.bytes[at],
            `lumen/${message.label}: byte ${at} is negative`,
          ).toBeGreaterThanOrEqual(0);
        }
      }

      // CLAUSE 5 - THE MANUFACTURER ID IS THE NON-COMMERCIAL ONE. The byte
      // right after 0xF0 is what a receiver reads as "who is this from", and
      // 0x7D is the id reserved for exactly this use. Anything else in that
      // slot claims somebody's registered id.
      for (const message of seen) {
        expect(
          message.bytes[1],
          `lumen/${message.label}: the byte after 0xF0 is a manufacturer id ` +
            `and must be 0x7D, the non-commercial one - got ` +
            `${message.bytes[1]}`,
        ).toBe(0x7d);
      }
    } finally {
      host.close();
    }

    process.stdout.write(
      "\nLUMEN colour over sysex, plan 11-10:\n" +
        seen
          .map(
            (message) =>
              `  ${message.label.padEnd(22)} ${message.bytes.join(", ")}` +
              `   "${message.bytes
                .slice(2, 8)
                .map((b) => String.fromCharCode(b))
                .join("")}"`,
          )
          .join("\n") +
        "\n",
    );
  }, 120000);

  it("records a GHOST path, replays it, and takes it back on the red corner - twice", async () => {
    // THE BENCH NOTE THIS ANSWERS: "GHOST: doesn't work reliably, the LED
    // colors the pad and resetting is not reliable, need to redesign this from
    // scratch". Plan 11-11 re-authored the entry from a blank page; this is the
    // one test that pins what the rewrite claims.
    //
    // THREE CLAIMS, AND THE THIRD IS THE ONE THE NOTE NAMES.
    //
    //   1. The round trip. A drag over three known cells is replayed by the
    //      ghost as EXACTLY those three cells and no others, and the controller
    //      stream replays exactly the three x coordinates the finger visited.
    //      The picture and the wire, because a card that lit the right cells
    //      while sending the wrong values would pass either one alone.
    //   2. The reset leaves NO CELL LIT, sampled against the frame rather than
    //      by eye - and sampled at +1 tick as well as after the settle, because
    //      the defect this replaces was visible on the very next tick and gone
    //      by the end of a long wait would not have been the complaint.
    //   3. THE RESET WORKS TWICE IN A ROW. "Resetting is not reliable" is a
    //      claim about the SECOND time, and a single-shot test cannot see it:
    //      an erase that left one variable set would clear the first recording
    //      and refuse the second while passing a one-round check.
    //
    // WHY +1 TICK IS THE INTERESTING SAMPLE, MEASURED RATHER THAN ARGUED. The
    // card this replaces cleared with `glp(a,1,0)`, which sets the phase and
    // touches neither the rate nor the timeout, and grid_led_tick does
    // `pha += fre` on every tick a timeout is still running. A cell mid-decay
    // at rate 250 set to phase 0 is at phase 250 on the next tick and then
    // walks off a phase that is no longer the one the timeout was armed for.
    // Planted on this entry's own shape with only the clear idiom swapped, that
    // form leaves three cells lit at every one of the 120 ticks after the
    // reset and never clears them - the old erase was CREATING the class-A
    // freeze rather than undoing it, and it never touched layer 2 at all. The
    // clear is now `glpfs(a,l,0,0,0)`: phase 0 AND rate 0.
    //
    // THE TWO RESET PRESSES ARE AT DIFFERENT PIXELS INSIDE ONE CELL, and that
    // is not cosmetic. The host's enqueue is CHANGE-GATED per contact on
    // (event, x, y), so a probe that pressed the same pixel twice would be
    // measuring the HOST's dedup and reporting it as the entry's. Both points
    // are asserted to land on cell 80 before either is used.
    const entry = entryById("ghost");
    const cc = knobValueOf(entry, "cc");
    /** The entry's own cell arithmetic, from its Timer: x*9//128+y*9//128*9. */
    const cellOf = (x: number, y: number): number =>
      Math.floor((x * 9) / 128) + Math.floor((y * 9) / 128) * 9;
    /** The erase key, from the entry's own Setup: glag(0,80). */
    const KEY_CELL = 80;
    /** The three columns the demonstration drag visits, on one row. */
    const PATH_COLUMNS = [1, 4, 7] as const;
    const PATH_ROW = 3;
    // One lap of a three-point recording is short; 200 ticks is many laps and
    // is longer than the 42-tick decay, so the union below is a full picture of
    // what the loop ever lights rather than a snapshot of one moment.
    const LAP_TICKS = 200;
    const report: string[] = [];

    const { host, sim } = await open(entry);
    try {
      const run = (n: number): void => {
        for (let i = 0; i < n; i += 1) host.tick();
      };
      const litNow = (): number[] => {
        const out: number[] = [];
        for (let cell = 0; cell < CELLS; cell += 1) {
          if (litAt(host.frame, cell)) out.push(cell);
        }
        return out;
      };

      const pathX = PATH_COLUMNS.map((column) => cellCentre(column));
      const pathY = cellCentre(PATH_ROW);
      const pathCells = PATH_COLUMNS.map((column) => column + PATH_ROW * 9);
      for (let i = 0; i < pathX.length; i += 1) {
        expect(
          cellOf(pathX[i], pathY),
          "ghost: the drag must visit the cell this test names",
        ).toBe(pathCells[i]);
      }

      for (const round of [1, 2] as const) {
        run(RESIDUE_WARMUP);

        // THE DRAG. A press, two moves, a lift - three cells, held long enough
        // at each for the Timer to sample it more than once.
        host.touchDown(0, pathX[0], pathY);
        run(6);
        host.touchMove(0, pathX[1], pathY);
        run(6);
        host.touchMove(0, pathX[2], pathY);
        run(6);
        host.touchUp(0, pathX[2], pathY);
        run(20);

        // 1. THE ROUND TRIP, in the picture and on the wire.
        const midiFrom = host.midi.length;
        const seen = new Set<number>();
        for (let i = 0; i < LAP_TICKS; i += 1) {
          run(1);
          for (const cell of litNow()) seen.add(cell);
        }
        const replayed = [...seen].sort((a, b) => a - b);
        expect(
          replayed,
          `ghost round ${round}: the ghost must retrace the cells the finger ` +
            `visited and nothing else. The erase key at cell ${KEY_CELL} is ` +
            "lit because there is a recording to erase, which is the state " +
            "the card is in",
        ).toEqual([...pathCells, KEY_CELL].sort((a, b) => a - b));

        const replayedX = [
          ...new Set(
            host.midi
              .slice(midiFrom)
              .filter((message) => message.p1 === cc)
              .map((message) => message.p2),
          ),
        ].sort((a, b) => a - b);
        expect(
          replayedX,
          `ghost round ${round}: the replayed controller stream carries the ` +
            "coordinates the finger was at, and no others - a loop that lit " +
            "the right cells while sending stale values would pass the " +
            "picture assertion alone",
        ).toEqual([...pathX].sort((a, b) => a - b));

        // 2 and 3. THE RESET, on the red corner, at a different pixel each
        // round so the host's change gate cannot swallow the second one.
        const keyPoint = 116 + round * 2;
        expect(
          cellOf(keyPoint, keyPoint),
          `ghost round ${round}: the reset probe must press the erase key`,
        ).toBe(KEY_CELL);
        host.touchTap(0, keyPoint, keyPoint);

        // +1 tick: the sample the old clear idiom failed. Then +2 and the full
        // settle, so "no cell lit" is a state rather than a moment.
        const after: { at: number; lit: number[] }[] = [];
        run(1);
        after.push({ at: 1, lit: litNow() });
        run(1);
        after.push({ at: 2, lit: litNow() });
        run(SETTLE_TICKS - 2);
        after.push({ at: SETTLE_TICKS, lit: litNow() });

        for (const sample of after) {
          expect(
            sample.lit,
            `ghost round ${round}: THE RESET MUST LEAVE NO CELL LIT. ` +
              `${sample.lit.length} of ${CELLS} are still showing ` +
              `${sample.at} tick(s) after the press on the erase key: ` +
              sample.lit
                .map(
                  (cell) =>
                    `cell ${cell} (col ${cell % 9}, row ${Math.floor(cell / 9)}` +
                    `, hardware ${screenToHw(cell % 9, Math.floor(cell / 9))}) ` +
                    `rendered ${rgbAt(host.frame, cell)}`,
                )
                .join("; "),
          ).toEqual([]);
        }

        // And nothing is left driving a layer either, which is the difference
        // between a dark pad and a cleared one: a black colour at a live phase
        // renders identically and comes back the moment a colour is written.
        const driven: string[] = [];
        for (let cell = 0; cell < CELLS; cell += 1) {
          const hw = screenToHw(cell % 9, Math.floor(cell / 9));
          for (const layer of LAYERS) {
            const record = sim.layer(hw, layer);
            if (record.pha !== 0 || record.fre !== 0) {
              driven.push(
                `cell ${cell} layer ${layer} at phase ${record.pha} rate ${record.fre}`,
              );
            }
          }
        }
        expect(
          driven.join("; "),
          `ghost round ${round}: after the reset every layer sits at phase 0 ` +
            "with rate 0. A layer left walking is a cell that comes back",
        ).toBe("");

        report.push(
          `  round ${round}: replayed ${JSON.stringify(replayed)} on ` +
            `CC ${cc} values ${JSON.stringify(replayedX)}; after the reset ` +
            after.map((s) => `+${s.at} -> ${s.lit.length} lit`).join(", "),
        );
      }

      expect(
        host.errors,
        "ghost: no handler raised across two record-replay-reset rounds - " +
          host.errors.join(" | "),
      ).toEqual([]);
    } finally {
      host.close();
    }

    process.stdout.write(
      "\nGHOST record, replay and reset, plan 11-11:\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);

  it("runs SHUTTLE faster the further out you push, and stops it on the red row", async () => {
    // THE BENCH NOTE THIS ANSWERS: "SHUTTLE: don't understand how it works,
    // rework". D-04 read that as a verdict on the BEHAVIOUR, and plan 11-12
    // re-authored the entry from a blank page: the ring became a bar on the
    // axis the finger actually pushes, the transport LATCHES, and the stop is
    // the whole bottom row painted red.
    //
    // THREE CLAIMS, AND THE THIRD IS THE ONE THE OLD FILE ARGUED COULD NOT BE
    // MADE.
    //
    //   1. SPEED RISES WITH DISTANCE FROM CENTRE, in both directions, asserted
    //      as a MONOTONIC RELATION over the nine columns rather than against
    //      nine literals - so a re-tuned period moves the numbers and not the
    //      test. The centre column sends nothing, and each side sends its own
    //      key: a probe that only counted messages would pass a card that ran
    //      the video backwards on both halves.
    //   2. THE STOP GESTURE STOPS IT. Not "sends less" - sends NOTHING, over a
    //      settle longer than the slowest period, with the bar back to its
    //      track and the red row dark.
    //   3. EVERY GESTURE HERE IS A FAST TAP. touchTap is the only path in the
    //      simulator that produces the coalesced code-9 message, and the old
    //      entry evaluated it to a speed of zero and did nothing at all. The
    //      whole probe is built out of taps, so claim 1 is also the assertion
    //      that a tap SETS a speed and claim 2 is the assertion that a tap
    //      CLEARS one. That pair is the machine form of the second reason
    //      shuttle.ts gave for refusing to latch - "a DOWNUP arrives with no
    //      lift behind it, so a tap that set a speed could never be cleared by
    //      the same gesture that set it" - and it is the reason the redesign
    //      put the exit on a cell instead of on the lift.
    //
    // EVERY COORDINATE AND EVERY BOUNDARY IS READ OFF THE ENTRY'S OWN LUA.
    // The bar's cell range, the stop row's cell range and both key codes are
    // parsed or derived here, so a card re-cut onto different rows moves this
    // test with it instead of silently drifting past it.
    const entry = entryById("shuttle");
    const source = entry.source;
    if (source.kind !== "lua") throw new Error("shuttle is not a lua entry");

    const barRange = /for n=(\d+),(\d+) do local d=n%9-4/.exec(source.timer);
    expect(
      barRange,
      "shuttle: the Timer still paints a bar over a cell run",
    ).not.toBeNull();
    const [barFrom, barTo] = [
      Number((barRange as RegExpExecArray)[1]),
      Number((barRange as RegExpExecArray)[2]),
    ];
    const stopRange = /for n=(\d+),(\d+) do local a=glag\(0,n\)glc\(a,1,q/.exec(
      source.timer,
    );
    expect(
      stopRange,
      "shuttle: the Timer still paints a stop row",
    ).not.toBeNull();
    const [stopFrom, stopTo] = [
      Number((stopRange as RegExpExecArray)[1]),
      Number((stopRange as RegExpExecArray)[2]),
    ];
    const forwardKey = knobValueOf(entry, "forward");
    const backwardKey = knobValueOf(entry, "backward");
    const slowestPeriod = knobValueOf(entry, "period");

    /** The row the bar occupies that a probe may safely push on. */
    const BAR_ROW = Math.floor(barFrom / 9) + 1;
    /** The row the stop lives on, from the entry's own cell run. */
    const STOP_ROW = Math.floor(stopFrom / 9);
    expect(STOP_ROW, "the stop row is one whole row").toBe(
      Math.floor(stopTo / 9),
    );

    // Long enough that the slowest speed fires several times: the slowest
    // period is @BASEP milliseconds at 10 ms a tick, and speed 1 divides it by
    // two.
    const WINDOW = slowestPeriod;
    const report: string[] = [];

    const { host } = await open(entry);
    try {
      const run = (n: number): void => {
        for (let i = 0; i < n; i += 1) host.tick();
      };
      const brightness = (cell: number): number =>
        host.frame[cell * 3] +
        host.frame[cell * 3 + 1] +
        host.frame[cell * 3 + 2];

      // THE REFERENCE PICTURE, TAKEN BEFORE ANY FINGER. "Lit" is defined
      // against the card's own resting track rather than against a literal
      // colour, so the assertion survives a re-tuned palette and a re-tuned
      // track. The centre column is excluded from it because the zero mark
      // BREATHES - it is brighter and dimmer than its own average by design,
      // and comparing a breathing cell against one sample of itself would
      // report the breath as a speed.
      run(RESIDUE_WARMUP);
      const atRest: number[] = [];
      for (let cell = barFrom; cell <= barTo; cell += 1)
        atRest[cell] = brightness(cell);
      const markLitAtRest = brightness(barFrom + 4 + 9) > 0;

      const stopRowLit = (): number[] => {
        const out: number[] = [];
        for (let cell = stopFrom; cell <= stopTo; cell += 1)
          if (litAt(host.frame, cell)) out.push(cell);
        return out;
      };
      /** Bar cells brighter than the untouched card leaves them. */
      const pushedOut = (): number[] => {
        const out: number[] = [];
        for (let cell = barFrom; cell <= barTo; cell += 1) {
          if (cell % 9 === 4) continue;
          if (brightness(cell) > atRest[cell] * 2) out.push((cell % 9) - 4);
        }
        return [...new Set(out)].sort((a, b) => a - b);
      };

      expect(
        markLitAtRest,
        "shuttle: the zero mark is lit with nobody touching the pad, or a " +
          "visitor cannot see where zero is",
      ).toBe(true);
      expect(
        stopRowLit(),
        "shuttle: the stop row is DARK while there is nothing to stop - a key " +
          "that is always there is a key that sometimes does nothing",
      ).toEqual([]);

      const presses: number[] = [];
      const codes: (number | undefined)[] = [];
      for (let column = 0; column < 9; column += 1) {
        // 3. A FAST TAP, every time. This is the only gesture the probe makes.
        host.touchTap(0, cellCentre(column), cellCentre(BAR_ROW));
        run(4);
        const from = host.hid.length;
        run(WINDOW);
        const sent = host.hid.slice(from);
        presses.push(sent.length);
        codes.push(
          sent.length === 0
            ? undefined
            : [...new Set(sent.map((each) => each.args[3]))].length === 1
              ? sent[0].args[3]
              : -1,
        );

        const out = pushedOut();
        const distance = column - 4;
        const expected =
          distance === 0
            ? []
            : Array.from({ length: Math.abs(distance) }, (_, j) =>
                distance > 0 ? j + 1 : -(j + 1),
              ).sort((a, b) => a - b);
        expect(
          out,
          `shuttle column ${column}: THE BAR MUST SHOW THE SPEED ON THE SIDE ` +
            "THE FINGER PUSHED, one cell per unit. Distances lit, measured " +
            `from the centre column: ${JSON.stringify(out)}`,
        ).toEqual(expected);
        expect(
          stopRowLit().length,
          `shuttle column ${column}: the stop row is lit exactly when there ` +
            "is a transport to stop",
        ).toBe(distance === 0 ? 0 : stopTo - stopFrom + 1);

        // 2. THE STOP, and it is a fast tap on the red row. Given a settle
        // longer than the slowest period, "stopped" means nothing at all.
        const stopFromIndex = host.hid.length;
        host.touchTap(0, cellCentre(column), cellCentre(STOP_ROW));
        run(WINDOW);
        const after = host.hid.length - stopFromIndex;
        expect(
          after,
          `shuttle column ${column}: THE RED ROW MUST STOP THE TRANSPORT. ` +
            `${after} keystroke(s) arrived in the ${WINDOW} ticks after the ` +
            "tap on it, and the slowest period this card can carry is " +
            `${slowestPeriod} ticks`,
        ).toBe(0);
        expect(
          pushedOut(),
          `shuttle column ${column}: after the stop the bar is back to its ` +
            "track, with no cell brighter than an untouched card leaves it",
        ).toEqual([]);
        expect(
          stopRowLit(),
          `shuttle column ${column}: after the stop the red row goes dark ` +
            "again, so the pad never carries a key with nothing behind it",
        ).toEqual([]);
      }

      // 1. MONOTONIC, AS A RELATION AND NEVER AS LITERALS. Strictly, on both
      // sides, and nothing at the centre.
      expect(presses[4], "shuttle: the centre column is zero").toBe(0);
      for (let column = 0; column < 4; column += 1) {
        expect(
          presses[column],
          `shuttle: pushing to column ${column} must run the transport ` +
            `strictly faster than column ${column + 1} - ` +
            JSON.stringify(presses),
        ).toBeGreaterThan(presses[column + 1]);
        expect(
          codes[column],
          `shuttle: everything left of centre sends the BACKWARD key`,
        ).toBe(backwardKey);
      }
      for (let column = 8; column > 4; column -= 1) {
        expect(
          presses[column],
          `shuttle: pushing to column ${column} must run the transport ` +
            `strictly faster than column ${column - 1} - ` +
            JSON.stringify(presses),
        ).toBeGreaterThan(presses[column - 1]);
        expect(
          codes[column],
          `shuttle: everything right of centre sends the FORWARD key`,
        ).toBe(forwardKey);
      }
      // NON-VACUITY. Nine columns of zero would satisfy every "stopped"
      // assertion above and prove nothing at all.
      expect(
        presses.reduce((a, b) => a + b, 0),
        "shuttle: the probe made the transport run at all",
      ).toBeGreaterThan(0);
      expect(
        forwardKey === backwardKey,
        "shuttle: the two directions send different keys, or the code " +
          "assertions above are vacuous",
      ).toBe(false);
      expect(
        host.errors,
        "shuttle: no handler raised across nine pushes and nine stops - " +
          host.errors.join(" | "),
      ).toEqual([]);

      report.push(
        "  presses per column in a " +
          WINDOW +
          "-tick window: " +
          JSON.stringify(presses),
        "  key code per column: " + JSON.stringify(codes),
        "  every gesture was a coalesced fast tap (code 9); the red row " +
          "stopped all nine",
      );
    } finally {
      host.close();
    }

    process.stdout.write(
      "\nSHUTTLE push, latch and stop, plan 11-12:\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);

  // -------------------------------------------------------------------------
  // STRIP, RE-LAID-OUT AS TWO INDEPENDENT CONTROLS (plan 11-13)
  //
  // THE BENCH NOTE: "STRIP: this is just an XY pad, it should be two faders,
  // one crossfader at the bottom and the big one, sending midi independently".
  // The word that carries the work is INDEPENDENTLY, and it is the one part of
  // that sentence that is exactly testable: drive one control and read the
  // OTHER control's controller number.
  //
  // The old card combined both axes into one fourteen-bit value on a single
  // controller, so there was no "other controller" to read. These two tests
  // are what makes the split a fact rather than a layout.
  //
  // EVERY BOUNDARY IS READ OFF THE ENTRY'S OWN LUA - the row the origin lock
  // splits on, the fader's divisor, the crossfader's shift and both controller
  // numbers - so a card re-cut onto different rows moves these tests with it
  // instead of drifting past them.
  // -------------------------------------------------------------------------

  /** STRIP's boundary, divisors and two controllers, parsed from its Lua. */
  const stripGeometry = (): {
    entry: CatalogEntry;
    boundary: number;
    shift: number;
    fader: number;
    cross: number;
  } => {
    const entry = entryById("strip");
    const source = entry.source;
    if (source.kind !== "lua") throw new Error("strip is not a lua entry");
    const lock = /s\.o\[i\]=y>(\d+)/.exec(source.setup);
    expect(
      lock,
      "strip: the onset must still lock a contact to ONE control by row - " +
        "without it, a drag off the bottom of the fader jogs the crossfader",
    ).not.toBeNull();
    // THE NUMERATOR IS DELIBERATELY LEFT FREE. Pinning it here would make a
    // fader that tops out short fail at THIS line, on the shape of its source,
    // instead of at the full-scale assertion that exists to catch it - and a
    // check that reddens on the wrong clause leaves its own clause untested.
    // What the numerator has to be is measured on the wire, not read here.
    const scale = /glim\(\((\d+)-y\)\*\d+\/\/(\d+),0,127\)/.exec(source.setup);
    expect(
      scale,
      "strip: the fader must still scale, AND CLAMP, from the rows it owns",
    ).not.toBeNull();
    const shift = /local p=x\/\/(\d+)/.exec(source.setup);
    expect(
      shift,
      "strip: the crossfader must still reduce the whole x axis by itself",
    ).not.toBeNull();
    const boundary = Number((lock as RegExpExecArray)[1]);
    expect(
      [
        Number((scale as RegExpExecArray)[1]),
        Number((scale as RegExpExecArray)[2]),
      ],
      "strip: THE BOUNDARY AND THE DIVISOR ARE THE SAME NUMBER. The fader's " +
        "last row and the scale that maps that row to zero are one fact, and " +
        "a divisor that has drifted off the boundary is exactly the defect " +
        "CONSOLE shipped - a fader that cannot reach one end of its range",
    ).toEqual([boundary, boundary]);
    const first = knobValueOf(entry, "cc");
    return {
      entry,
      boundary,
      shift: Number((shift as RegExpExecArray)[1]),
      fader: first,
      cross: first + 1,
    };
  };

  it("drives STRIP's two controls on their own controllers, and neither on the other's", async () => {
    const g = stripGeometry();
    const { host } = await open(g.entry);
    const report: string[] = [];
    try {
      expect(
        host.coordMax,
        "strip: both axes are unlocked to ten bits, so every coordinate " +
          "below is on the 0..1023 scale the entry actually reads",
      ).toBe(1023);

      const run = (n: number): void => {
        for (let i = 0; i < n; i += 1) host.tick();
      };
      const bright = (cell: number): number =>
        host.frame[cell * 3] +
        host.frame[cell * 3 + 1] +
        host.frame[cell * 3 + 2];
      run(RESIDUE_WARMUP);

      // ---------------------------------------------------------------------
      // LEGIBILITY, ASSERTED RATHER THAN ASSUMED, AND WITHOUT NAMING A COLOUR.
      //
      // D-11-12-b: nothing in this repository asserts that a card is legible,
      // and 11-12 proved it by giving forward and reverse one colour and
      // watching the whole tree stay green. Two controls on one pad have the
      // same failure available to them - they can read as ONE picture - and
      // both of STRIP's hues are knobs a visitor can set to the same value.
      //
      // So the claim asserted here is about SHAPE, which no knob can flatten:
      // the fader is a solid block of full rows growing from the bottom, and
      // the crossfader is a line with exactly one cell brighter than its
      // eight neighbours. A pad on which those two are the same picture fails
      // this, whatever colours it was given.
      // ---------------------------------------------------------------------
      const rowBrightness: number[] = [];
      for (let r = 0; r < 8; r += 1) {
        const cells: number[] = [];
        for (let c = 0; c < 9; c += 1) cells.push(bright(r * 9 + c));
        expect(
          new Set(cells).size,
          `strip: fader row ${r} must be uniform across all nine columns - a ` +
            "fader is a block, not a dot",
        ).toBe(1);
        rowBrightness.push(cells[0]);
      }
      const levels = [...new Set(rowBrightness)].sort((a, b) => a - b);
      expect(
        levels.length,
        `strip: the fader draws exactly two states, lit and unlit. Observed ` +
          `${JSON.stringify(rowBrightness)}`,
      ).toBe(2);
      const litRows = rowBrightness
        .map((value, row) => (value === levels[1] ? row : -1))
        .filter((row) => row >= 0);
      expect(
        litRows,
        "strip: the lit rows form ONE run ending at the bottom row of the " +
          `fader. Observed ${JSON.stringify(litRows)}`,
      ).toEqual(
        Array.from(
          { length: litRows.length },
          (_, i) => 7 - litRows.length + 1 + i,
        ),
      );

      const crossRow: number[] = [];
      for (let c = 0; c < 9; c += 1) crossRow.push(bright(72 + c));
      const crossLevels = [...new Set(crossRow)].sort((a, b) => a - b);
      expect(
        crossLevels.length,
        `strip: the crossfader draws a track AND a marker - two states on one ` +
          `row. Observed ${JSON.stringify(crossRow)}`,
      ).toBe(2);
      expect(
        crossRow.filter((value) => value === crossLevels[1]).length,
        "strip: exactly ONE cell of the crossfader row is the marker",
      ).toBe(1);
      expect(
        crossLevels[0],
        "strip: the crossfader's track is VISIBLE at rest - a control whose " +
          "unmarked cells are black is a single dot, and a dot is not a strip",
      ).toBeGreaterThan(0);
      expect(
        crossLevels[1] / crossLevels[0],
        "strip: the marker must stand well clear of its own track",
      ).toBeGreaterThan(2);
      report.push(
        `  at rest: fader rows ${JSON.stringify(rowBrightness)}`,
        `  at rest: crossfader row ${JSON.stringify(crossRow)}`,
      );

      // ---------------------------------------------------------------------
      // THE FOUR DRIVES. Every one of them MOVES ITS COORDINATE ON EVERY STEP,
      // because the host's own change gate silently drops a repeated
      // (event, x, y) per contact - a probe built out of identical samples
      // would be defeated by the host rather than answered by the entry.
      // ---------------------------------------------------------------------
      const drive = (
        id: number,
        from: readonly [number, number],
        to: readonly [number, number],
        steps: number,
      ): readonly HostMidi[] => {
        const mark = host.midi.length;
        const at = (i: number): [number, number] => [
          Math.round(from[0] + ((to[0] - from[0]) * i) / steps),
          Math.round(from[1] + ((to[1] - from[1]) * i) / steps),
        ];
        host.touchDown(id, from[0], from[1]);
        host.tick();
        for (let i = 1; i <= steps; i += 1) {
          const [x, y] = at(i);
          host.touchMove(id, x, y);
          host.tick();
        }
        host.touchUp(id, to[0], to[1]);
        host.tick();
        return host.midi.slice(mark);
      };
      const controllersIn = (sent: readonly HostMidi[]): number[] => [
        ...new Set(sent.map((each) => each.p1)),
      ];
      const barHeight = (): number =>
        rowBrightness
          .map((_, r) => bright(r * 9))
          .filter((v) => v === levels[1]).length;
      const markerColumn = (): number => {
        let best = -1;
        let peak = -1;
        for (let c = 0; c < 9; c += 1) {
          const value = bright(72 + c);
          if (value > peak) {
            peak = value;
            best = c;
          }
        }
        return best;
      };

      // 1. THE CROSSFADER, driven across its whole row while the fader sits at
      //    the height Setup left it.
      const barBefore = barHeight();
      expect(
        barBefore,
        "strip: the card arrives with the fader part-open, or the assertion " +
          "below that it DID NOT MOVE is vacuous",
      ).toBeGreaterThan(0);
      const across = drive(1, [0, 1000], [1023, 1000], 1023);
      expect(
        across.length,
        "strip: driving the crossfader sent something at all",
      ).toBeGreaterThan(0);
      expect(
        controllersIn(across),
        `strip: THE CROSSFADER SENDS ON ${g.cross} AND ON NOTHING ELSE. ` +
          `Observed ${JSON.stringify(controllersIn(across))}`,
      ).toEqual([g.cross]);
      expect(
        barHeight(),
        "strip: the fader's bar did not move while the crossfader was driven",
      ).toBe(barBefore);

      // 2. A CONTACT THAT BEGINS ON THE CROSSFADER AND IS DRAGGED THE WHOLE
      //    HEIGHT OF THE FADER. This is the origin lock read from below: the
      //    finger crosses all eight fader rows and the fader must not move.
      const upward = drive(3, [200, 1000], [900, 0], 400);
      expect(
        upward.length,
        "strip: the upward drag sent something at all",
      ).toBeGreaterThan(0);
      expect(
        controllersIn(upward),
        "strip: A GESTURE THAT STARTED ON THE CROSSFADER STAYS ON THE " +
          `CROSSFADER. It crossed all eight fader rows and sent only ` +
          `${JSON.stringify(controllersIn(upward))}`,
      ).toEqual([g.cross]);
      expect(
        barHeight(),
        "strip: the fader's bar did not move under a gesture that was not its " +
          "own, even though the finger travelled its entire length",
      ).toBe(barBefore);

      // 3. THE FADER, driven down the rows it owns.
      const markBefore = markerColumn();
      const down = drive(0, [500, 0], [500, g.boundary], g.boundary);
      expect(
        down.length,
        "strip: driving the fader sent something at all",
      ).toBeGreaterThan(0);
      expect(
        controllersIn(down),
        `strip: THE FADER SENDS ON ${g.fader} AND ON NOTHING ELSE. Observed ` +
          `${JSON.stringify(controllersIn(down))}`,
      ).toEqual([g.fader]);
      expect(
        markerColumn(),
        "strip: the crossfader's marker did not move while the fader was " +
          "driven",
      ).toBe(markBefore);

      // 4. THE OVERSHOOT, which is the gesture the layout makes easy and the
      //    lock exists for: the fader's zero end IS the crossfader's row, so a
      //    finger that runs off the bottom of the fader lands on the other
      //    control. x sweeps 300 -> 820 during it, so an unlocked card would
      //    drag the crossfader most of the way across.
      const past = drive(2, [300, g.boundary - 110], [820, 1023], 223);
      expect(
        past.length,
        "strip: the overshoot sent something at all",
      ).toBeGreaterThan(0);
      expect(
        controllersIn(past),
        "strip: A GESTURE THAT STARTED ON THE FADER STAYS ON THE FADER. It " +
          "ran off the bottom of the fader and across the crossfader row, " +
          `sweeping x by 520 units, and sent ${JSON.stringify(controllersIn(past))}`,
      ).toEqual([g.fader]);
      expect(
        markerColumn(),
        "strip: THE CROSSFADER DID NOT MOVE while a finger ran across it",
      ).toBe(markBefore);

      expect(
        host.errors,
        `strip: no handler raised across four drives - ${host.errors.join(" | ")}`,
      ).toEqual([]);
      report.push(
        `  crossfader driven: ${across.length} messages, controller ` +
          `${JSON.stringify(controllersIn(across))}, fader bar unmoved at ${barBefore}`,
        `  dragged up out of the crossfader: ${upward.length} messages, ` +
          `controller ${JSON.stringify(controllersIn(upward))}`,
        `  fader driven: ${down.length} messages, controller ` +
          `${JSON.stringify(controllersIn(down))}, marker unmoved at column ${markBefore}`,
        `  dragged off the bottom of the fader: ${past.length} messages, ` +
          `controller ${JSON.stringify(controllersIn(past))}`,
      );
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nSTRIP independence, plan 11-13:\n" + report.join("\n") + "\n",
    );
  }, 120000);

  it("carries both of STRIP's controls from 0 to 127, and never outside seven bits", async () => {
    const g = stripGeometry();
    const { host } = await open(g.entry);
    const report: string[] = [];
    try {
      const sweep = (
        id: number,
        axis: "x" | "y",
        fixed: number,
        last: number,
      ): number[] => {
        const mark = host.midi.length;
        const point = (t: number): [number, number] =>
          axis === "x" ? [t, fixed] : [fixed, t];
        host.touchDown(id, ...point(0));
        host.tick();
        for (let t = 1; t <= last; t += 1) {
          host.touchMove(id, ...point(t));
          host.tick();
        }
        host.touchUp(id, ...point(last));
        host.tick();
        return host.midi.slice(mark).map((each) => each.p2);
      };

      // THE FADER'S TRAVEL IS THE ROWS IT OWNS, AND NOT THE WHOLE AXIS. That
      // is the whole of the CONSOLE lesson: a control whose divisor comes from
      // the axis rather than from its own share of it stops short of full
      // scale, silently, at every position. CONSOLE's h*127//8 topped out at
      // 111 of 127.
      const fader = sweep(0, "y", 500, g.boundary);
      const cross = sweep(1, "x", 1000, host.coordMax);

      for (const [name, controller, values] of [
        ["fader", g.fader, fader],
        ["crossfader", g.cross, cross],
      ] as const) {
        const distinct = new Set(values);
        expect(
          values.length,
          `strip ${name}: the sweep sent nothing at all, so nothing below ` +
            "proves anything",
        ).toBeGreaterThan(0);
        // THE FOURTEEN-BIT LOSS, RECORDED AS AN ASSERTION RATHER THAN AS A
        // COMMENT, AND ASSERTED FIRST. STRIP used to send one controller
        // carrying 0..16383 on mode 1. Re-introducing that - or the vernier
        // that fed it - is now a DELIBERATE edit to these four lines rather
        // than a silent change of behaviour.
        //
        // IT IS FIRST BECAUSE OF WHAT IT LEAVES FOR THE CLAUSES BELOW. A
        // control that emitted 0..255 would fail "reaches 127" too, and a
        // check that reddens on the wrong clause leaves its own clause
        // untested (11-10). Seven bits is the more fundamental claim, so it is
        // the one that gets to fail.
        for (const value of distinct) {
          expect(
            Number.isInteger(value) && value >= 0 && value <= 127,
            `strip ${name}: every emitted value fits SEVEN BITS. This card ` +
              "traded one fourteen-bit stream for two ordinary controllers, " +
              `and ${value} is outside 0..127`,
          ).toBe(true);
        }
        expect(
          Math.max(...values),
          `strip ${name}: A CONTROL MUST REACH THE TOP OF ITS RANGE. ` +
            `Observed maximum ${Math.max(...values)} on controller ` +
            `${controller} over ${values.length} messages`,
        ).toBe(127);
        expect(
          Math.min(...values),
          `strip ${name}: and the bottom of it. Observed minimum ` +
            `${Math.min(...values)}`,
        ).toBe(0);
        expect(
          distinct.size,
          `strip ${name}: every one of the 128 codes of a seven-bit ` +
            "controller is reachable across the travel. That is what the " +
            "ten-bit unlock is still in this entry FOR: on a locked axis the " +
            "fader owns 114 raw positions of 128 and could only ever send 114 " +
            `of the codes. Observed ${distinct.size}`,
        ).toBe(128);
        report.push(
          `  ${name.padEnd(10)} controller ${controller}: ${values.length} ` +
            `messages, ${distinct.size} distinct, ${Math.min(...values)}..` +
            `${Math.max(...values)}, all seven-bit`,
        );
      }

      // AND THE OVERSHOOT, WHICH IS WHERE THE SEVEN-BIT CLAIM WAS ACTUALLY
      // BROKEN. The origin lock means the fader branch can see coordinates
      // past its own last row, and the first draft of the shipped layout put
      // 15,14,...,0,-1,-2,...,-16 on the wire with nothing red anywhere. The
      // clamp is what holds this line.
      const over = sweep(2, "y", 300, host.coordMax);
      expect(
        over.length,
        "strip: the overshoot sent something at all",
      ).toBeGreaterThan(0);
      expect(
        Math.min(...over),
        "strip: A CONTROL DRIVEN PAST ITS OWN LAST ROW MUST NOT GO NEGATIVE. " +
          `Observed minimum ${Math.min(...over)} over ${over.length} messages`,
      ).toBe(0);
      expect(
        Math.max(...over),
        "strip: and it must not wrap upward either",
      ).toBeLessThanOrEqual(127);
      report.push(
        `  overshoot   controller ${g.fader}: ${over.length} messages, ` +
          `${Math.min(...over)}..${Math.max(...over)} (a pre-clamp draft ` +
          "reached -16)",
      );
      expect(
        host.errors,
        `strip: no handler raised across three sweeps - ${host.errors.join(" | ")}`,
      ).toEqual([]);
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nSTRIP full scale and seven bits, plan 11-13:\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);
});
