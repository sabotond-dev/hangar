// The execution gate: every hand-authored configuration actually RUNS - the one question a static
// analysis cannot ask (the budget, canonical form and subset questions are lua-entries.sweep.spec.ts's).
// Thirty-nine tests since 2026-09-17 (the count is read from the runner's report, never from this
// line; it moved with every phase 11 and 12 bench note and the 12-12 gate found it six stale). The
// catalog-wide tests loop over the Lua entries internally and name the entry in their message, so a
// wave that adds a configuration touches no number here; a per-entry title leaves with its entry.
// Every entry is put through the SAME scripted gesture: a drag (a press and six diagonal moves two
// ticks apart), a lift, and a fast tap (firmware event 9, coalesced from a sub-cycle press-and-lift).
// The engine is assembled from renderLua plus createLuaHost rather than createEngine because the
// pitfall-1 guard reads the raw layer records. SMOKE_REPORT=1 prints the per-entry MIDI and HID summary.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CELLS, PRESETS, compile } from "../../vendor/botor/_pad";
import { glcStops, PadSim, screenToHw } from "../../vendor/botor/pad-sim";
import { CATALOG, type CatalogEntry } from "../catalog";
import {
  calibratedAxis,
  KX,
  KY,
  knotsOf,
  LED_STEP,
  sensorAt,
} from "../catalog/calibration";
import {
  LIBRARY_PARTS,
  TOUCH_LIBRARY,
  TOUCH_LIBRARY_TIMER,
} from "../catalog/library";
import { presetById } from "../catalog/presets";
import { presetWire } from "../catalog/entries/ported-midi";
import { baseStateFor, resetAll } from "../tune/state";
import { compilerKnobs } from "../share/stamp";
import type { LuaKnob } from "../catalog/types";
import { createLuaHost, type HostHid, type HostMidi } from "./lua-host";
import { blankPadState, previewIndices, renderLua } from "./lua-pad-sim";
import { noteName, noteNumber, widgetFor, wordFor } from "../tune/view";

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
    // Exactly what createLuaPadSim hands a hand-authored entry (12-07): the
    // touch library as the system Setup. No entry calls it yet, so nothing here
    // moves - but from 12-08 on an entry that called `Q` without it would raise
    // "attempt to call a nil value" in this gate rather than in a card.
    system: TOUCH_LIBRARY,
    systemTimer: TOUCH_LIBRARY_TIMER,
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
            // Shape 0 is the decay - a one-shot whose brightness IS its phase,
            // so a keeper under it replaces the countdown and the cell strobes.
            // Shape 3 is the firmware's sine, a periodic look that wraps by
            // design: the compiler's own rings-from-centre walks it at 254
            // under a keeper on every RADAR card, and RADAR carries that call
            // verbatim since change 12b (2026-09-18), so the shape is read.
            if (
              record.timeout >= KEEPER_FLOOR &&
              record.fre >= DECAY_RATE_FLOOR &&
              record.sha === 0
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
 * A watchdog release is part of what a fast tap sends. CHORUS holds a chord
 * until twenty 100 ms Timer ticks have passed with no event on
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
 * The cells MORPH's four macro readouts occupy, DERIVED FROM THE ENTRY.
 *
 * It used to be four typed numbers and a 2x2 walk, matching the entry's
 * `self.k={0,7,63,70}` and `base + d%2 + d//2*9`. Plan 12-09 widened the blocks
 * to 3x3 on the bench's "bigger corner regions where only one channel is sent",
 * which took the count from sixteen to thirty-six and turned the typed copy
 * into a silent under-count: the residue probe reported fifteen legitimate
 * macro readouts as frozen residue. So both halves - the four bases and the
 * block's side - are read out of the entry's own Setup, exactly as the
 * corner-tap test reads them, and the next geometry change moves this with it.
 */
const MORPH_MACROS: readonly number[] = (() => {
  const entry = CATALOG.find((candidate) => candidate.id === "morph");
  // Both events since change 17B: the Setup names the blocks (`s.k`), the Timer - pulled in by
  // the Setup, never armed - paints them.
  const setup =
    typeof entry !== "undefined" && entry.source.kind === "lua"
      ? `${entry.source.setup} ${entry.source.timer}`
      : "";
  const bases = /(?:self|s)\.k=\{([^}]*)\}/.exec(setup);
  const side =
    /for d=0,\d+ do local a=glag\(0,(?:self|s)\.k\[j\+1\]\+d%(\d+)/.exec(setup);
  if (bases === null || side === null)
    throw new Error(
      "morph: self.k and the corner paint loop are not where this probe " +
        "reads them, so the residue allowance below cannot be derived",
    );
  const n = Number(side[1]);
  return bases[1]
    .split(",")
    .map(Number)
    .flatMap((base) =>
      Array.from(
        { length: n * n },
        (_, d) => base + (d % n) + Math.floor(d / n) * 9,
      ),
    );
})();

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
      "MORPH is an XY macro controller and these cells ARE its four macro " +
      "readouts - four blocks whose size the entry declares, thirty-six cells " +
      "since plan 12-09 widened them from sixteen. Setup paints them at phase " +
      "0 and every touch writes the value it just sent to them. A touched " +
      "MORPH is supposed to show four non-zero macros, and no coordinate " +
      "exists that returns all four to zero (the four products of x, y, 127-x " +
      "and 127-y cannot all vanish at once), so this cannot be double-tapped " +
      "away. THE PRICE OF THE WIDER BLOCKS IS STATED RATHER THAN LEFT: this " +
      "allowance is per CELL and not per layer, so the comet trail is excused " +
      "wherever it lands inside a corner block - nine cells a corner rather " +
      "than four. The trail lands on phase 0 by construction (the class-A " +
      "idiom, and decay-idiom.spec.ts is where that is gated), so the " +
      "forty-five cells still under this probe are what watch it here.",
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
    system: TOUCH_LIBRARY,
    systemTimer: TOUCH_LIBRARY_TIMER,
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

/**
 * Every MIDI, HID and SYSEX message one entry sent, as comparable strings.
 *
 * SYSEX JOINED THE LIST IN PLAN 12-11, and it was a gap rather than a taste
 * change. The probe's question is "does a fast tap send what a slow tap sends",
 * and `gmss` is a send: LUMEN is the catalog's only sysex emitter and its whole
 * response to a tap is the colour under the finger. Until 12-11 that entry also
 * sent two axis CCs on the DOWN, so the probe had something to compare and the
 * blindness never showed; moving those CCs onto the library's `A` - which sends
 * per axis on change and primes silently on a press - left a tap that produces
 * no MIDI at all, and the probe's own non-vacuity clause caught it on the first
 * full run. The clause says "Move PARITY_TAP, do not weaken this", and neither
 * was the answer: a static tap sends no controller ANYWHERE on that card now,
 * by design, so the fix is to record the message it does send.
 */
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
      // The third log, added by 12-11 - see `Sent`. `presetParity` below does
      // NOT take it, and that is not an oversight: a preset is compiled from a
      // PadState and the compiler has no sysex emitter at all (`gmss` is not in
      // _pad.ts's OUT_CALLS), so the line would be dead code there and would
      // read as though a preset might one day send one.
      ...host.sysex.map((s) => `sysex(${s.bytes.join(",")})`),
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
  // NO `system` HERE, AND THAT IS THE POINT (12-07). A preset is compiled from a
  // PadState and calls nothing HANGAR wrote, so it does not need the touch
  // library and must not be measured with it: the install path gives a preset
  // the firmware's own page init, so a preview that ran one over the library
  // would be previewing a module state no visitor can reach.
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

/**
 * The centre of cell index k on one axis, for a nine-wide t*9//128 mapping.
 *
 * THE NAIVE INVERSE, AND SINCE 12.1 ONLY FOR THE ENTRIES THAT STILL USE IT:
 * the compiled presets and the hand-authored entries whose own Lua reads
 * `t*9//128` (ARC, GHOST, STAGE, STRIP, WHEELS, TRACKPAD). An entry that reads
 * its cell through the library's `Q` reads the MEASURED map, and a gesture
 * aimed at one of its cells is aimed with `ledCentre` below - on the
 * measured tables `cellCentre(0)` is 7, which the map puts on LED 1.
 */
function cellCentre(k: number): number {
  return Math.floor((k * 128 + 64) / 9);
}

/**
 * Every raw coordinate that lands in cell k under a nine-wide t*9//128 map -
 * the naive set, kept for the one MORPH probe whose claim is about the entry's
 * raw-unit weights over a run of samples rather than about a cell.
 */
function coordinatesIn(k: number): number[] {
  const out: number[] = [];
  for (let t = 0; t <= 127; t += 1)
    if (Math.floor((t * 9) / 128) === k) out.push(t);
  return out;
}

// ---------------------------------------------------------------------------
// THE CALIBRATED HELPERS (phase 12.1). Every value below comes out of the two
// knot tables in calibration.ts or out of the library's own `W`; nothing is
// typed, so a knot that moves in the table moves every gesture and every
// expectation here with it.
// ---------------------------------------------------------------------------

/** The raw value the sensor reports with a finger centred on LED k - the knot. */
function ledCentre(k: number, axis: "x" | "y"): number {
  return sensorAt(k, axis);
}

/** The nearest LED of a calibrated coordinate - the library's `(u+32)//64`. */
function nearestLed(u: number): number {
  return Math.floor((u + LED_STEP / 2) / LED_STEP);
}

/**
 * The hold margin `W` uses, in 64ths of a pitch, READ OFF THE LIBRARY PART
 * rather than typed: `u-p*64<45 and p*64-u<45`. A margin edited in the
 * library moves every band expectation here with it.
 */
function holdFraction(): number {
  const w = LIBRARY_PARTS.find((p) => p.name === "W");
  if (!w) throw new Error("the library has no W part");
  const m = /<(\d+) and [a-z]\*64-[a-z]<(\d+) then/.exec(w.lua);
  if (!m || m[1] !== m[2])
    throw new Error(`W's hold margin is not one number: ${w.lua}`);
  return Number(m[1]);
}

/** The library's `W`: hold LED p while |u - p*64| < the margin, else the nearest. */
function holdOrNearest(u: number, p: number | undefined): number {
  if (p !== undefined && Math.abs(u - p * LED_STEP) < holdFraction()) return p;
  return nearestLed(u);
}

/** The nearest calibrated cell of a raw point - the library's `N`. */
function calibratedCell(x: number, y: number): number {
  return (
    nearestLed(calibratedAxis(x, "x")) + nearestLed(calibratedAxis(y, "y")) * 9
  );
}

/** Every raw coordinate whose nearest calibrated LED on one axis is k. */
function calibratedCoordinatesIn(k: number, axis: "x" | "y"): number[] {
  const out: number[] = [];
  for (let t = 0; t <= 127; t += 1)
    if (nearestLed(calibratedAxis(t, axis)) === k) out.push(t);
  return out;
}

/** The first raw value, walking up from LED p's knot, at which `W` lets go of p. */
function switchUp(p: number, axis: "x" | "y"): number {
  const k = knotsOf(axis);
  for (let v = k[p]; v <= k[p + 1]; v += 1)
    if (calibratedAxis(v, axis) >= p * LED_STEP + holdFraction()) return v;
  throw new Error(`no up-switch between LED ${p} and ${p + 1} on ${axis}`);
}

/** The first raw value, walking down from LED p+1's knot, at which `W` lets go of p+1. */
function switchDown(p: number, axis: "x" | "y"): number {
  const k = knotsOf(axis);
  for (let v = k[p + 1]; v >= k[p]; v -= 1)
    if (calibratedAxis(v, axis) <= (p + 1) * LED_STEP - holdFraction())
      return v;
  throw new Error(`no down-switch between LED ${p + 1} and ${p} on ${axis}`);
}

function entryById(id: string): CatalogEntry {
  const found = CATALOG.find((candidate) => candidate.id === id);
  if (typeof found === "undefined")
    throw new Error(`${id} is not in the catalog`);
  return found;
}

const consoleEntry = (): CatalogEntry => entryById("console");

/**
 * The phase a MUTED CONSOLE column paints its body at, on layer 2 alone.
 *
 * console.ts's P() writes `(j>1 and 90 or 0)` for a muted body cell that is lit
 * (change 17B folded the two layers into one loop, j the layer): a dim body on
 * layer 2 under a lit @MUTEC cap, and layer 1 forced to 0. It is RESTATED
 * here rather than imported, because the entry ships one Lua string and not a
 * table of constants - and it is held against that string by the assertion
 * below, so a change to the dim level stops the test instead of quietly
 * making its picture assertion vacuous.
 */
const MUTED_BODY_PHASE = 90;
const MUTED_BODY_CALL = `(j>1 and ${MUTED_BODY_PHASE} or 0)`;

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
  const x = ledCentre(column, "x");
  const y = ledCentre(row, "y");
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
  const x = ledCentre(column, "x");
  const rows: number[] = [];
  host.touchDown(0, x, ledCentre(8, "y"));
  host.tick();
  rows.push(8);
  for (let row = 7; row >= 1; row -= 1) {
    host.touchMove(0, x, ledCentre(row, "y"));
    host.tick();
    rows.push(row);
  }
  host.touchUp(0, x, ledCentre(1, "y"));
  host.tick();
  return rows;
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
  const y = ledCentre(0, "y");
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
  const xs = calibratedCoordinatesIn(column, "x");
  const ys = calibratedCoordinatesIn(0, "y");
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
// ORBIT (EUCLID until change 8), SONAR and STEPS all toggle a cell, and all three used to filter every
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

/** Chebyshev distance from the centre cell (4,4). ORBIT's ring number (1..4 since change 8). */
function ringOf(cell: number): number {
  return Math.max(Math.abs((cell % 9) - 4), Math.abs(Math.floor(cell / 9) - 4));
}

const SWIPE_ENTRIES: readonly SwipeEntry[] = [
  {
    id: "orbit",
    armLayer: 1,
    eligible: (cell) => ringOf(cell) >= 1 && ringOf(cell) <= 4,
    why:
      "ORBIT's rings are the four concentric squares at Chebyshev distance " +
      "1, 2, 3 and 4 (the outermost square is the fourth ring since change 8); " +
      "only the centre carries no step, and its Setup leaves self.i nil there",
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
            // reason: ARC, POMODORO and STAGE each run one deliberately
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

    // -----------------------------------------------------------------------
    // THE BOUNDARY FINGER, ADDED IN PLAN 12-09 - one fader, not two.
    //
    // CONSOLE now takes its cell from the touch library's `Q`, so the
    // per-column hysteresis the four sequencers got in 12-08 arrives here as
    // well, and this is the assertion that says what it buys a MIXER: a finger
    // that runs down the line between two columns drives ONE strip. Without it
    // a fader placed on the seam alternates between two controllers on a
    // one-unit wobble - PROBE-RESULTS-2026-09-10.md Q2 - and a mixer receives
    // two half-moved faders instead of one moved one.
    //
    // THE SEAM IS DERIVED FROM THE MEASURED MAP (12.1): the two raw x values
    // either side of the point where the nearest calibrated LED flips from 3
    // to 4, so a bare nearest-LED read flips on every sample of the trace
    // below. (Under the naive read it was 56/57; on the measured knots it is
    // one LED's third-of-a-pitch further left.)
    // -----------------------------------------------------------------------
    {
      const nearest = (v: number): number => nearestLed(calibratedAxis(v, "x"));
      let flip = KX[3];
      while (nearest(flip) < 4) flip += 1;
      const SEAM = [flip - 1, flip];
      expect(
        SEAM.map(nearest),
        "the seam must really be a seam under a nearest-LED read, or the " +
          "stage below is a finger sitting inside one column",
      ).toEqual([3, 4]);

      const { host } = await open(entry);
      try {
        // Down on the seam, then every body row with x alternating across it.
        host.touchDown(0, SEAM[0], ledCentre(8, "y"));
        host.tick();
        let step = 1;
        for (let row = 7; row >= 1; row -= 1) {
          host.touchMove(0, SEAM[step % 2], ledCentre(row, "y"));
          host.tick();
          step += 1;
        }
        host.touchUp(0, SEAM[step % 2], ledCentre(1, "y"));
        host.tick();

        const perController = new Map<number, number[]>();
        for (const m of host.midi) {
          if (m.cmd !== 176) continue;
          perController.set(m.p1, [...(perController.get(m.p1) ?? []), m.p2]);
        }
        const columns = [...perController.keys()]
          .map((p1) => p1 - cc)
          .sort((a, b) => a - b);
        report.push(
          `seam between columns 3 and 4 (x ${SEAM.join("/")}): driven ` +
            `column(s) ${columns.join(", ")} - ` +
            [...perController.entries()]
              .map(([p1, values]) => `cc ${p1}: ${values.join(",")}`)
              .join("; "),
        );
        expect(
          columns,
          "console: A FADER FINGER ON THE LINE BETWEEN TWO COLUMNS MUST DRIVE " +
            "ONE FADER. The naive read this card used to do flips between " +
            "columns 3 and 4 on a one-unit wobble, so a strip on the seam sent " +
            "half its travel to each of two controllers. `Q`'s per-axis " +
            `hysteresis is what holds it. Observed columns ${columns.join(", ")}`,
        ).toEqual([3]);
        expect(
          perController.get(cc + 3),
          "console: and it must still reach the top of its travel while it " +
            "does - a held column that cannot get to 127 is a different bug",
        ).toContain(127);
        expect(
          host.errors,
          `console: no handler raised - ${host.errors.join(" | ")}`,
        ).toEqual([]);
      } finally {
        host.close();
      }
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

  // THE REVERSAL, ON THE RECORD (plan 12-05). This title used to read "leaves
  // a muted CONSOLE column inert" and stages 2 and 3 asserted exactly that:
  // a muted sweep sent nothing AND stored nothing, so the unmute handed back
  // the level the strip was muted at. That was 11-07's reading of the bench
  // note "you should not be able to interact with the 'muted' faders". The
  // user then said, in their own words: "you should be able to change the
  // muted ones only don't send the midi from those." Interactive and SILENT,
  // not inert. So the two stages are REWRITTEN rather than deleted - the
  // muted sweep must still send nothing, and must now MOVE and REPAINT, and
  // the unmute must carry the level the muted finger moved it to.
  it("moves a muted CONSOLE column silently, and sends the moved level on unmute", async () => {
    const entry = consoleEntry();
    const cc = knobValueOf(entry, "cc");
    const column = 3;
    const controller = cc + column;
    const { host, sim } = await open(entry);
    const report: string[] = [];
    try {
      const on = (n: number): number[] =>
        host.midi
          .slice(n)
          .filter((m) => m.cmd === 176 && m.p1 === controller)
          .map((m) => m.p2);

      // THE PICTURE, read off the sim rather than inferred from the wire -
      // which is the whole point of the reversal, because the wire is now
      // silent for the move this stage is about. A muted column paints its
      // body on LAYER 2 ONLY, at phase 90 where `8-r < h` and 0 elsewhere
      // (console.ts's P(): `glc(a,r<1 and j or 2,@MUTEC,1)` and, lit, `(j>1
      // and 90 or 0)` - change 17B), so the count of 90s in rows 1..8 IS the
      // stored level.
      expect(
        entry.source.kind === "lua" && entry.source.setup,
        "console: the muted branch no longer paints its body with " +
          `${MUTED_BODY_CALL}, so the phase this test reads is not the one ` +
          "the entry writes",
      ).toContain(MUTED_BODY_CALL);
      const mutedBody = (): number[] => {
        const out: number[] = [];
        for (let row = 1; row <= 8; row += 1)
          out.push(sim.layer(hwOfCell(row * 9 + column), 2).pha);
        return out;
      };
      const litCount = (): number =>
        mutedBody().filter((phase) => phase === MUTED_BODY_PHASE).length;

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
      // Non-vacuity for stage 2: the muted picture starts at the remembered 4.
      const litAtMute = litCount();
      expect(
        litAtMute,
        "console: a muted column must still show the level it was muted at, " +
          "or the move in stage 2 has nothing to move away from",
      ).toBe(4);

      // 2. The whole fader body, swept, while the column is muted. The sweep
      //    ends on row 1, which is h = 8 - 1 = 7 - the top of the travel, and
      //    the furthest the picture can get from the 4 it was muted at.
      mark = host.midi.length;
      const whileMuted = sweepConsoleBody(host, column);
      const litAfterMove = litCount();
      report.push(
        `swept while muted: ${whileMuted.length} sample(s) delivered, ` +
          `${on(mark).length} message(s), body ${litAtMute} -> ` +
          `${litAfterMove} cell(s) lit`,
      );
      expect(
        whileMuted.length,
        "console: the muted sweep delivered no touch samples at all, so its " +
          "silence proves nothing. Fix the gesture, not the assertion",
      ).toBeGreaterThan(0);
      expect(
        on(mark),
        "console: A MUTED FADER MUST SEND NOTHING. The user's sentence is " +
          "\"you should be able to change the muted ones only don't send the " +
          'midi from those" - so only the gms is gated, `if not s.m[c]then ' +
          "s:gms(...)end`. If that gate goes, this sweep sends eight messages " +
          "from a strip the mixer was told to ignore",
      ).toEqual([]);
      expect(
        litAfterMove,
        "console: A MUTED FADER MUST STILL MOVE AND REPAINT. This REVERSES " +
          "11-07, which folded `and not s.m[c]` into the fader condition so a " +
          "muted column stored nothing and painted nothing; the user's own " +
          "correction is that the muted ones can be changed. The body is " +
          `painted on layer 2 at phase ${MUTED_BODY_PHASE}, so a sweep to the ` +
          `top of the travel lights seven of the eight body cells. Observed ` +
          `[${mutedBody().join(", ")}]`,
      ).toBe(7);

      // 3. The mute cap again. It must now send the level the MUTED FINGER
      //    moved it to - 7, not the 4 it was muted at - because the mute-row
      //    branch still sends `m and 0 or s.v[c]*127//7` and s.v[c] is what
      //    stage 2 stored. 7*127//7 is 127 exactly, which is also the proof
      //    that the divisor is still 7.
      mark = host.midi.length;
      tapConsoleCell(host, column, 0);
      const restored = on(mark);
      report.push(`mute cap tapped again: ${restored.join(", ")}`);
      expect(
        restored,
        "console: unmuting must send the level the strip was MOVED to while " +
          "muted, exactly once. Stage 2 drove it to h = 7, which is " +
          "7*127//7 = 127. A 72 here is 11-07's inert reading back again - " +
          "the muted sweep stored nothing and the unmute handed back the 4 " +
          "the strip was muted at",
      ).toEqual([Math.floor((7 * 127) / 7)]);

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
          "because the branch fires on `Q`'s CHANGE SIGNAL - the library " +
          "returns the cell only when the cell changed, which is exactly what " +
          "the per-contact self.q[i] this entry carried until plan 12-09 was",
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
          `${resting} samples arrived; with a bare cell computed on every ` +
          "sample the mute toggles on every one of them, which at the " +
          "firmware's rate is a strip flickering at 100 Hz under a still " +
          "finger. That is why the mute row was onset-gated before plan 11-07, " +
          "why 11-07 bought the swipe with self.q[i], and why plan 12-09 could " +
          "hand both to `Q` - it returns the cell only when the cell changed",
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

  it("arms one cell per cell a swipe crosses, on ORBIT, SONAR and STEPS", async () => {
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
          const y = ledCentre(4, "y");
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
          "0 cells on euclid (orbit since change 8) and 1 on sonar and steps. " +
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
          const xs = calibratedCoordinatesIn(3, "x");
          const ys = calibratedCoordinatesIn(4, "y");
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
          const x = ledCentre(3, "x");
          const y = ledCentre(4, "y");
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
    // Change 17B: each corner has its own Number; corner j sends cc<j>, which is base + j at the
    // defaults (the top-left corner's is 16, the old base 15 plus one).
    const base = knobValueOf(entry, "cc1") - 1;
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
    // Change 17B: each corner has its own Number; corner j sends cc<j>, which is base + j at the
    // defaults (the top-left corner's is 16, the old base 15 plus one).
    const base = knobValueOf(entry, "cc1") - 1;
    const setup = entry.source.kind === "lua" ? entry.source.setup : "";
    // THE CORNER BASES ARE READ OUT OF THE ENTRY'S OWN self.k, never typed, so
    // moving a corner reddens this test instead of escaping it (`s.k` since change 17B).
    const kDecl = /(?:self|s)\.k=\{([^}]*)\}/.exec(setup);
    expect(kDecl, "morph: self.k must be declared in the Setup").not.toBe(null);
    const K = (kDecl as RegExpExecArray)[1].split(",").map(Number);
    expect(K.length, "morph: four corner blocks").toBe(4);
    // THE BLOCK IS 3x3 FROM PLAN 12-09 AND ITS SIDE IS DERIVED, NOT TYPED. The
    // Lua walks `k + d%N + d//N*9` over `d = 0, N*N-1`, so N is read off the
    // entry's own paint loop; the bench asked for "bigger corner areas where
    // only one channel is sent" and this is the number that answers it.
    // The paint loop is the Timer's since change 17B (pulled in by the Setup, never armed).
    const sideDecl =
      /for d=0,(\d+) do local a=glag\(0,(?:self|s)\.k\[j\+1\]\+d%(\d+)/.exec(
        entry.source.kind === "lua" ? `${setup} ${entry.source.timer}` : "",
      );
    expect(
      sideDecl,
      "morph: the Setup paint loop must declare the corner block's geometry",
    ).not.toBe(null);
    const SIDE = Number((sideDecl as RegExpExecArray)[2]);
    expect(
      [SIDE, Number((sideDecl as RegExpExecArray)[1])],
      "morph: the block is SIDE x SIDE and the loop runs d = 0 .. SIDE*SIDE-1",
    ).toEqual([SIDE, SIDE * SIDE - 1]);
    expect(
      SIDE,
      "morph: THE CORNER BLOCKS ARE 3x3 (plan 12-09). The bench asked for " +
        "bigger regions where only one channel is sent; a 2x2 block is four " +
        "cells of eighty-one and a finger aimed at a corner misses it",
    ).toBe(3);
    const blockOf = (k: number): number[] =>
      Array.from(
        { length: SIDE * SIDE },
        (_, d) => k + (d % SIDE) + Math.floor(d / SIDE) * 9,
      );
    // The cell a press lands on, as the entry's `Q` reads it since 12-09: the
    // nearest calibrated cell (12.1), not the naive `t*9//128`.
    const cellOf = (x: number, y: number): number => calibratedCell(x, y);
    // THE DEAD MARGIN, READ OFF THE ENTRY (plan 12-09). The bench asked that
    // "the zero point should not sit only in the extreme corner", so the raw
    // axis is remapped before the weights: raw 24 reads 0 and raw 103 reads
    // 127, and everything outside saturates. Both constants come out of the
    // Setup, so moving the margin reddens this test instead of escaping it.
    const marginDecl = /x=glim\(\(x-(\d+)\)\*127\/\/(\d+),0,127\)/.exec(setup);
    expect(
      marginDecl,
      "morph: the Setup must remap the raw axis before the weights",
    ).not.toBe(null);
    const MARGIN = Number((marginDecl as RegExpExecArray)[1]);
    const SPAN = Number((marginDecl as RegExpExecArray)[2]);
    expect(
      [MARGIN, SPAN, MARGIN + SPAN],
      "morph: the mapping runs from raw MARGIN to raw MARGIN+SPAN, and the " +
        "top end has to be inside the seven-bit axis",
    ).toEqual([24, 79, 103]);
    /** The entry's own remap: Lua's `//` floors, including on a negative. */
    const mapped = (v: number): number =>
      Math.min(127, Math.max(0, Math.floor(((v - MARGIN) * 127) / SPAN)));
    /** The bilinear weights the entry computes, in the entry's own order. */
    const weightsAt = (rawX: number, rawY: number): number[] => {
      const x = mapped(rawX);
      const y = mapped(rawY);
      const u = 127 - x;
      const v = 127 - y;
      return [
        Math.floor((u * v) / 127),
        Math.floor((x * v) / 127),
        Math.floor((u * y) / 127),
        Math.floor((x * y) / 127),
      ];
    };
    /**
     * The cell of corner j's block that sits NEAREST THE PAD CENTRE, and the
     * raw point at its centre.
     *
     * It used to be the middle of the 2x2 block. With a 3x3 block AND a dead
     * margin the middle is inside the saturated region, where three weights are
     * arithmetically 0 and a one-message result would be the old behaviour
     * wearing the new one's clothes - so the probe moves to the block's INNER
     * cell, which is both where all four weights are non-zero and where a
     * finger aimed at a corner from the middle of the pad actually lands.
     */
    const aimAt = (k: number): [number, number] => {
      const inner = (start: number): number =>
        start === 0 ? SIDE - 1 : start + 0;
      // The raw coordinate of that cell NEAREST THE PAD CENTRE, on the measured
      // map (12.1): the cell is read through `Q`, so it spans the raw values
      // whose nearest calibrated LED it is, and the LED's own centre is too
      // close to MORPH's dead margin (raw 24) for all four weights to be
      // non-zero - corner 1's inner LED sits at raw (29, 26).
      const towardsCentre = (cell: number, axis: "x" | "y"): number => {
        const raw = calibratedCoordinatesIn(cell, axis);
        return cell < 4 ? raw[raw.length - 1] : raw[0];
      };
      return [
        towardsCentre(inner(k % 9), "x"),
        towardsCentre(inner(Math.floor(k / 9)), "y"),
      ];
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
          `own ${SIDE}x${SIDE} block, derived from self.k`,
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

    // 4. THE CONTINUOUS MORPH IS PINNED TO A LITERAL rather than to a count.
    //    11-08 shipped a first swipe shape whose output was indistinguishable
    //    from the bug it was fixing, and a message count would have gone green
    //    on it. This stroke starts at the centre cell - so its onset is NOT in
    //    a corner - and runs the diagonal into the bottom-right block, so it
    //    also proves that a MOVE sample crossing a corner still morphs.
    //
    //    THE LITERAL WAS RE-CAPTURED IN PLAN 12-09 AND THE REASON IS THE POINT.
    //    It read "captured BEFORE the change" - the entry as 11-08 left it -
    //    and 12-09's dead margin DELIBERATELY moves this sequence: the raw axis
    //    is remapped so that raw 24 reads 0 and raw 103 reads 127, which is the
    //    bench's "the zero point should not sit only in the extreme corner".
    //    A literal that survived that would mean the margin had not landed. So
    //    it is re-captured against the entry as 12-09 leaves it, and the clause
    //    below keeps the ORIGINAL question answerable by a literal that has
    //    moved: all four corners must still speak across the stroke, which is
    //    exactly what a corner branch reaching MOVE samples would destroy.
    //    120 messages here against 158 before, because the saturated ends of
    //    both axes suppress the corners that are pinned at 0 and 127.
    const DIAGONAL_MORPH = [
      "16:31 17:31 18:31 19:32 16:30 19:33 16:28 19:35 16:26",
      "19:37 16:25 19:38 16:23 19:40 16:22 19:41 16:21 17:30",
      "18:30 19:44 16:19 19:46 16:18 19:47 16:17 17:29 18:29",
      "19:50 16:16 19:51 16:15 17:28 18:28 19:54 16:13 19:56",
      "17:27 18:27 19:58 16:11 19:60 16:10 17:26 18:26 19:63",
      "17:25 18:25 19:65 16:9 17:24 18:24 19:68 16:8 19:69",
      "16:7 17:23 18:23 19:72 16:6 17:22 18:22 19:75 17:21",
      "18:21 19:77 16:5 17:20 18:20 19:80 16:4 19:81 17:18",
      "18:18 19:85 16:3 17:17 18:17 19:88 17:16 18:16 19:90",
      "16:2 17:15 18:15 19:93 17:14 18:14 19:95 16:1 17:13",
      "18:13 19:98 17:11 18:11 19:102 17:10 18:10 19:104 16:0",
      "17:9 18:9 19:107 17:8 18:8 19:109 17:6 18:6 19:113",
      "17:4 18:4 19:117 17:3 18:3 19:119 17:1 18:1 19:123",
      "17:0 18:0 19:127",
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
            `${DIAGONAL_MORPH.length} pinned`,
        );
        // THE CLAUSE THE LITERAL EXISTS FOR, STATED SO IT SURVIVES A RE-CAPTURE.
        // A corner branch that reached MOVE samples would let ONE corner speak
        // for the whole stroke; all four have to.
        expect(
          [...new Set(host.midi.map((m) => m.p1))].sort((a, b) => a - b),
          "morph: ALL FOUR CORNERS MUST SPEAK ACROSS A CONTINUOUS STROKE. The " +
            "corner-tap branch is gated on the onset edge and this stroke's " +
            "onset is the centre cell, so a branch that reached MOVE samples " +
            "would truncate this to one controller",
        ).toEqual([0, 1, 2, 3].map((j) => base + j + 1));
        expect(
          seq.join(" "),
          "morph: THE CONTINUOUS MORPH MUST BE BYTE-IDENTICAL to the sequence " +
            "committed as a literal above, re-captured at plan 12-09 against " +
            "the dead margin. Every value here is a bilinear weight of the " +
            "REMAPPED axis, so a margin that moved - or a corner branch that " +
            "reached a MOVE - shows up as a diff rather than as a count",
        ).toBe(DIAGONAL_MORPH.join(" "));
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

  it("keeps MORPH's weights moving inside a cell, holds its trail on ONE cell, and saturates inside the margin", async () => {
    // THE BENCH NOTE THIS ANSWERS, VERBATIM: "MORPH: kozepen random vilagitas,
    // ne csak teljesen a sarokban legyen 0 pont, legyen nagyobb tere a
    // mappolasnak ahol. tehat a sarkokban legyenek nagyobbak a teruletek ahol
    // csak egy ch-t kuld ki" - random lighting in the middle; the zero point
    // should not be only in the exact corner; bigger corner regions where only
    // one channel is sent.
    //
    // THIS IS ALSO WHERE 12-RESEARCH'S CALL SHAPE IS CORRECTED ON THE RECORD.
    // The research writes the caller as
    //
    //     if i>0 then return end local c=Q(s,i,e,x,y)if not c then return end
    //
    // and that shape WOULD FREEZE THIS CARD. `Q` returns nil when the cell has
    // not changed, and MORPH's whole output is a bilinear blend of the RAW
    // position - four weights that must be recomputed and re-sent on every
    // sample inside a cell, because a cell is 14 raw units wide and a finger
    // travelling across one moves every macro it owns. Returning on the nil
    // would send four messages on the first sample of each cell and NOTHING for
    // the fourteen units after it. So MORPH keeps its own end test, calls `Q`
    // for the TRAIL CELL ALONE, and sends its weights regardless. Stage 1 is
    // the assertion that says so, and 12-09's negative check shipped the
    // research's shape and read the frozen count off it.
    const entry = entryById("morph");
    // Change 17B: each corner has its own Number; corner j sends cc<j>, which is base + j at the
    // defaults (the top-left corner's is 16, the old base 15 plus one).
    const base = knobValueOf(entry, "cc1") - 1;
    const setup = entry.source.kind === "lua" ? entry.source.setup : "";
    const marginDecl = /x=glim\(\(x-(\d+)\)\*127\/\/(\d+),0,127\)/.exec(setup);
    expect(
      marginDecl,
      "morph: the Setup must remap the raw axis before the weights",
    ).not.toBe(null);
    const MARGIN = Number((marginDecl as RegExpExecArray)[1]);
    const SPAN = Number((marginDecl as RegExpExecArray)[2]);
    /** The entry's own remap, clamped exactly as its glim clamps. */
    const mapped = (v: number): number =>
      Math.min(127, Math.max(0, Math.floor(((v - MARGIN) * 127) / SPAN)));
    const weightsAt = (rawX: number, rawY: number): number[] => {
      const x = mapped(rawX);
      const y = mapped(rawY);
      return [
        Math.floor(((127 - x) * (127 - y)) / 127),
        Math.floor((x * (127 - y)) / 127),
        Math.floor(((127 - x) * y) / 127),
        Math.floor((x * y) / 127),
      ];
    };
    const naiveCell = (x: number, y: number): number =>
      Math.floor((x * 9) / 128) + Math.floor((y * 9) / 128) * 9;
    const report: string[] = [];

    // -----------------------------------------------------------------------
    // 1. THE WEIGHTS MOVE INSIDE A CELL. Four samples, all inside cell 40 under
    //    the naive read AND under the hysteresis, so `Q` returns a cell on the
    //    DOWN and nil on all three MOVEs.
    // -----------------------------------------------------------------------
    const WOBBLE_X = [60, 61, 60, 61];
    const WOBBLE_Y = 60;
    {
      expect(
        WOBBLE_X.map((x) => naiveCell(x, WOBBLE_Y)),
        "morph: every sample of the in-cell wobble must be the SAME cell, or " +
          "this stage is measuring a cell change rather than a frozen weight",
      ).toEqual([40, 40, 40, 40]);
      // NON-VACUITY: the mapped position really moves, so there is a weight to
      // freeze. A wobble that mapped to one point would prove nothing.
      const seen = WOBBLE_X.map((x) => weightsAt(x, WOBBLE_Y).join("/"));
      expect(
        new Set(seen).size,
        `morph: the wobble must move a weight - observed ${seen.join(" ")}`,
      ).toBeGreaterThan(1);

      const { host } = await open(entry);
      try {
        const perSample: number[] = [];
        let mark = 0;
        host.touchDown(0, WOBBLE_X[0], WOBBLE_Y);
        host.tick();
        perSample.push(host.midi.length - mark);
        mark = host.midi.length;
        for (let k = 1; k < WOBBLE_X.length; k += 1) {
          host.touchMove(0, WOBBLE_X[k], WOBBLE_Y);
          host.tick();
          perSample.push(host.midi.length - mark);
          mark = host.midi.length;
        }
        report.push(
          `  wobble inside cell 40 (x ${WOBBLE_X.join(",")} at y ${WOBBLE_Y}): ` +
            `${perSample.join(" + ")} = ${host.midi.length} message(s); ` +
            `weights ${seen.join(" -> ")}`,
        );
        expect(
          perSample.slice(1).every((n) => n > 0),
          "morph: THE WEIGHTS MUST MOVE INSIDE A CELL. `Q` returns nil for " +
            "every one of these MOVEs, so the research's " +
            "`if not c then return end` would leave the card sending on the " +
            "DOWN and nothing afterwards - a macro pad that only answers the " +
            `first pixel of each cell. Observed ${perSample.join(", ")} ` +
            "message(s) per sample",
        ).toBe(true);
        expect(
          host.midi.length,
          "morph: and the total has to be more than the first sample's, which " +
            "is the number the frozen shape produces",
        ).toBeGreaterThan(perSample[0]);
        // AND IT IS THE RIGHT VALUES, not merely a count: every message
        // carries the bilinear weight of the REMAPPED position.
        const last = weightsAt(WOBBLE_X[WOBBLE_X.length - 1], WOBBLE_Y);
        for (let j = 0; j < 4; j += 1) {
          const values = host.midi
            .filter((m) => m.p1 === base + j + 1)
            .map((m) => m.p2);
          expect(
            values[values.length - 1],
            `morph: corner ${j + 1}'s last word must be its weight at the ` +
              `last sample. Observed ${values.join(", ")}`,
          ).toBe(last[j]);
        }
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 2. THE TRAIL HOLDS ONE CELL. This is "random lighting in the middle":
    //    the comet used to be re-armed at a cell computed naively on every
    //    sample, so a finger resting on the line between two cells lit BOTH,
    //    alternating at 100 Hz. The trail cell is now `Q`'s, and `Q` returns a
    //    cell only when the cell changed - which is why this is the ONE thing
    //    MORPH does take from the library's return value.
    // -----------------------------------------------------------------------
    {
      const TRAIL_X = [71, 72, 71, 72, 73, 72];
      const naive = TRAIL_X.map((x) => naiveCell(x, WOBBLE_Y));
      expect(
        [...new Set(naive)].sort((a, b) => a - b),
        "morph: the trail probe must be a real boundary wobble - the naive " +
          "read has to cross - or holding one cell proves nothing",
      ).toEqual([40, 41]);

      const { host, sim } = await open(entry);
      try {
        host.touchDown(0, TRAIL_X[0], WOBBLE_Y);
        host.tick();
        for (let k = 1; k < TRAIL_X.length; k += 1) {
          host.touchMove(0, TRAIL_X[k], WOBBLE_Y);
          host.tick();
        }
        const lit: number[] = [];
        for (let cell = 0; cell < 81; cell += 1)
          if (sim.layer(hwOfCell(cell), 2).pha !== 0) lit.push(cell);
        report.push(
          `  trail after the boundary wobble (x ${TRAIL_X.join(",")}): lit ` +
            `cell(s) ${lit.join(", ")}; the naive read lights ` +
            `${[...new Set(naive)].join(" and ")}`,
        );
        expect(
          lit,
          "morph: A WOBBLING FINGER MUST LIGHT ONE TRAIL CELL. The naive cell " +
            "this card computed until plan 12-09 flips on a one-unit wobble " +
            "(PROBE-RESULTS-2026-09-10.md Q2), so the comet was re-armed on " +
            "two cells alternately and the middle of the pad flickered. `Q`'s " +
            `hysteresis holds one. Observed ${lit.join(", ")}`,
        ).toEqual([naive[0]]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 3. THE MARGIN. "The zero point should not sit only in the extreme
    //    corner": raw 0..24 reads 0 and raw 103..127 reads 127 on both axes, so
    //    a finger a cell and a half in from a corner is already at full scale.
    // -----------------------------------------------------------------------
    {
      expect(
        [mapped(0), mapped(MARGIN), mapped(MARGIN + SPAN), mapped(127)],
        "morph: the remap saturates at both ends of the raw axis",
      ).toEqual([0, 0, 127, 127]);
      // A CELL AND A HALF, STATED AS CELLS RATHER THAN AS RAW UNITS: the whole
      // of cells 0 and 1 on each axis is inside the dead margin, and a cell is
      // 128/9 = 14.22 raw units, so the margin is 24/14.22 = 1.7 cells.
      expect(
        [mapped(cellCentre(0)), mapped(cellCentre(1)), mapped(cellCentre(7))],
        "morph: the centres of the first two cells already read 0 and the " +
          "centre of cell 7 already reads 127 - the corner regions are AREAS, " +
          "not the one extreme pixel the bench complained about",
      ).toEqual([0, 0, 127]);

      const AIM: [number, number] = [10, 10];
      const w = weightsAt(...AIM);
      const unMargined = Math.floor(((127 - 10) * (127 - 10)) / 127);
      expect(
        w,
        `morph: at (${AIM.join(",")}) corner 1 must read a FULL 127 and the ` +
          `other three exactly 0. Without the margin it reads ${unMargined}`,
      ).toEqual([127, 0, 0, 0]);

      const { host } = await open(entry);
      try {
        host.touchDown(0, AIM[0], AIM[1]);
        host.tick();
        const sent = host.midi.map((m) => `cc ${m.p1}: ${m.p2}`);
        report.push(
          `  press at (${AIM.join(",")}): ${sent.join(", ")} - un-margined ` +
            `corner 1 would read ${unMargined}`,
        );
        expect(
          sent,
          "morph: ONE MESSAGE, AT FULL SCALE. Cell 0 is inside corner 1's " +
            "block so only corner 1 may speak, and the margin is what makes " +
            "the value it speaks a 127 rather than something short of it. The " +
            "other three are arithmetically 0 and self.p starts at 0, so they " +
            "say nothing at all",
        ).toEqual([`cc ${base + 1}: 127`]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nMORPH, the corners widened and the trail held (plan 12-09):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length, "all three stages of the MORPH probe ran").toBe(3);
  }, 120000);

  it("sets what MORPH's four corners send dead centre, holds 127 under the finger and 0 opposite, and is the identity at its default", async () => {
    // CHANGE 9 (2026-09-18, BENCH-2026-09-16.txt section 9). The bench asked
    // to be able to "setup the value of the center"; the answer recorded was
    // (a) - a knob holding the CC value each corner sends with the finger dead
    // centre, "the blend reshap[ing] around it so a corner still reaches 127
    // under the finger and the others fall toward 0".
    //
    // THE FOUR WEIGHTS THEMSELVES DO NOT MOVE. `w = {u*v//127, ...}` still
    // sums to the full range; the knob shapes what is SENT, over the weight,
    // in two linear segments whose breakpoint is the weight a finger reads
    // dead centre. That is the only reading of "the weights' sum survives"
    // that a settable centre admits - four weights summing to 127 whose
    // OUTPUT is shaped - because a blend putting an arbitrary value in the
    // middle could not sum to the full range at all.
    //
    // AT THE DEFAULT THE MAP IS THE EXACT INTEGER IDENTITY, and the proof of
    // that is a test that was already here: the pinned DIAGONAL_MORPH literal
    // in the corner-tap test above is UNMOVED by this change. What this test
    // adds is the rest - the identity over all 128 weights rather than over
    // one stroke, the value dead centre at every knob position, the corner and
    // its opposite, the one-message rule at a shaped centre, the paint
    // following the value SENT, and the position that is NOT offered and why.
    const entry = entryById("morph");
    // Change 17B: each corner has its own Number; corner j sends cc<j>, which is base + j at the
    // defaults (the top-left corner's is 16, the old base 15 plus one).
    const base = knobValueOf(entry, "cc1") - 1;
    const setup = entry.source.kind === "lua" ? entry.source.setup : "";
    const knob = entry.knobs.find((each) => each.id === "centre");
    expect(knob, "morph carries the centre knob (change 9)").toBeDefined();
    if (!knob) return;
    expect(knob.label, "the word the inspector shows").toBe("Centre");
    expect(
      knob.values.every((value) => /^[0-9]+$/.test(value)),
      "morph: every centre value must be a plain integer so the rail carries " +
        `a readout - ${knob.values.join(", ")}`,
    ).toBe(true);
    const CENTRES = knob.values.map(Number);
    const DEFAULT = entry.defaults.centre ?? knob.default;

    // THE MAP IS READ OFF THE ENTRY'S OWN TEMPLATE, never typed here, so a
    // breakpoint that moves reddens this test instead of escaping it.
    const mapDecl =
      /z=z<(\d+) and z\*@CENTRE\/\/(\d+) or @CENTRE\+\(z-(\d+)\)\*\(127-@CENTRE\)\/\/(\d+)/.exec(
        setup,
      );
    expect(
      mapDecl,
      "morph: the Setup must shape the weight between reading it and sending it",
    ).not.toBe(null);
    if (!mapDecl) return;
    const BREAK = Number(mapDecl[1]);
    expect(
      [Number(mapDecl[2]), Number(mapDecl[3]), Number(mapDecl[4])],
      "morph: each segment divides by the span it covers - BREAK below the " +
        "breakpoint and 127-BREAK above it - and the second starts at BREAK",
    ).toEqual([BREAK, BREAK, 127 - BREAK]);
    /** The entry's own two-segment map, in JS. Lua's `//` floors. */
    const shaped = (w: number, c: number): number =>
      w < BREAK
        ? Math.floor((w * c) / BREAK)
        : c + Math.floor(((w - BREAK) * (127 - c)) / (127 - BREAK));
    expect(
      CENTRES[DEFAULT],
      `morph: THE DEFAULT CENTRE MUST BE THE BREAKPOINT ${BREAK}. That is ` +
        "what makes the map the identity, and the identity is what keeps " +
        "every byte this card has ever put on a wire where it was",
    ).toBe(BREAK);

    // THE DEAD MARGIN AND THE WEIGHTS, read off the entry as the two probes
    // above read them: the axis is remapped before the blend.
    const marginDecl = /x=glim\(\(x-(\d+)\)\*127\/\/(\d+),0,127\)/.exec(setup);
    expect(
      marginDecl,
      "morph: the Setup must remap the raw axis before the weights",
    ).not.toBe(null);
    if (!marginDecl) return;
    const MARGIN = Number(marginDecl[1]);
    const SPAN = Number(marginDecl[2]);
    const mapped = (v: number): number =>
      Math.min(127, Math.max(0, Math.floor(((v - MARGIN) * 127) / SPAN)));
    const weightsAt = (rawX: number, rawY: number): number[] => {
      const x = mapped(rawX);
      const y = mapped(rawY);
      const u = 127 - x;
      const v = 127 - y;
      return [
        Math.floor((u * v) / 127),
        Math.floor((x * v) / 127),
        Math.floor((u * y) / 127),
        Math.floor((x * y) / 127),
      ];
    };
    // The corner blocks, from self.k (`s.k` since change 17B) and the paint loop's own 3x3 geometry.
    const kDecl = /(?:self|s)\.k=\{([^}]*)\}/.exec(setup);
    expect(kDecl, "morph: self.k must be declared in the Setup").not.toBe(null);
    if (!kDecl) return;
    const K = kDecl[1].split(",").map(Number);
    const blockOf = (k: number): number[] =>
      Array.from({ length: 9 }, (_, d) => k + (d % 3) + Math.floor(d / 3) * 9);

    // THE RAW POINT THE ENTRY'S OWN REMAP CALLS DEAD CENTRE. Derived, not
    // typed: the smallest raw coordinate the margin maps into the middle of
    // the axis, which is where the four weights are as close to equal as
    // integer division allows.
    let CENTRE_RAW = -1;
    for (let v = 0; v <= 127 && CENTRE_RAW < 0; v += 1)
      if (mapped(v) >= 63) CENTRE_RAW = v;
    expect(
      mapped(CENTRE_RAW),
      `morph: the dead-centre probe at raw ${CENTRE_RAW} must land in the middle of the axis`,
    ).toBeLessThanOrEqual(64);
    const CENTRE_W = weightsAt(CENTRE_RAW, CENTRE_RAW);
    expect(
      CENTRE_W,
      "morph: dead centre the four raw weights are a quarter each, and the " +
        "one-unit split is integer division's rather than this change's",
    ).toEqual([31, 31, 31, 32]);

    const report: string[] = [];

    // 1. THE DEFAULT IS THE IDENTITY OVER EVERY WEIGHT, not over a sample.
    for (let w = 0; w <= 127; w += 1)
      expect(
        shaped(w, BREAK),
        `morph: at the default the map must be the identity, and at weight ${w} it is not`,
      ).toBe(w);

    // 2. EVERY POSITION IS PINNED AT BOTH ENDS, LANDS THE KNOB'S OWN VALUE AT
    //    THE BREAKPOINT, AND NEVER FALLS. The first two are the bench's own
    //    words - 127 under the finger, 0 at the opposite corner - and the
    //    third is what makes the knob a response curve rather than a step.
    for (const c of CENTRES) {
      expect(shaped(0, c), `morph: weight 0 sends 0 at centre ${c}`).toBe(0);
      expect(
        shaped(127, c),
        `morph: A CORNER MUST STILL REACH 127 at centre ${c}`,
      ).toBe(127);
      expect(
        shaped(BREAK, c),
        `morph: the breakpoint weight must send the knob's own value, ${c}`,
      ).toBe(c);
      const seen: number[] = [];
      for (let w = 0; w <= 127; w += 1) seen.push(shaped(w, c));
      for (let w = 1; w <= 127; w += 1)
        expect(
          seen[w] >= seen[w - 1],
          `morph: the map must never fall - centre ${c}, weight ${w}: ` +
            `${seen[w - 1]} then ${seen[w]}`,
        ).toBe(true);
      report.push(
        `centre ${String(c).padStart(3)}: ${new Set(seen).size} distinct ` +
          `values over the travel, dead centre ` +
          CENTRE_W.map((w) => shaped(w, c)).join("/"),
      );
    }

    // 3. 127 IS NOT OFFERED, AND THE REJECTION IS ARITHMETIC RATHER THAN
    //    TASTE: at 127 the second segment is 127+(z-BREAK)*0//95, so every
    //    weight at or above the breakpoint reads 127 and each macro pins full
    //    across the whole quadrant nearest its corner. Measured here rather
    //    than asserted by fiat, beside the top position that IS offered.
    const distinctAt = (c: number): number =>
      new Set(Array.from({ length: 128 }, (_, w) => shaped(w, c))).size;
    expect(CENTRES, "morph: 127 is not a centre position").not.toContain(127);
    expect(
      distinctAt(127),
      "morph: a centre of 127 would leave this many distinct values over the whole travel",
    ).toBe(33);
    expect(
      distinctAt(Math.max(...CENTRES)),
      "morph: the top position that IS offered keeps this many",
    ).toBe(64);
    report.push(
      `the rejected 127: ${distinctAt(127)} distinct values against ` +
        `${distinctAt(Math.max(...CENTRES))} at the offered top and ` +
        `${distinctAt(BREAK)} at the default`,
    );

    /** One host per knob position, the Timer handed over as `open` does (MORPH's is pulled in since change 17B). */
    const openAt = async (index: number) => {
      const { setup: body, timer } = renderLua(entry, {
        ...entry.defaults,
        centre: index,
      });
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup: body,
        timer,
      });
      return { host, sim };
    };

    // 4. DEAD CENTRE, AT EVERY POSITION OF THE KNOB, IN THE REAL LUA HOST.
    for (let index = 0; index < CENTRES.length; index += 1) {
      const c = CENTRES[index];
      const { host, sim } = await openAt(index);
      try {
        host.touchDown(0, CENTRE_RAW, CENTRE_RAW);
        host.tick();
        const sent = host.midi.map((m) => `cc${m.p1}=${m.p2}`);
        // 11-08's suppression is untouched: s.p starts at zero, so a corner
        // whose SHAPED value is 0 says nothing at all. At a centre of 0 that
        // is all four and the middle of the pad is silent - honest rather
        // than stuck, because a corner the finger walks away from still sends
        // its single 0 on the way out (the stroke test above holds that).
        const expected = CENTRE_W.map((w, j) => ({
          cc: base + j + 1,
          value: shaped(w, c),
        })).filter((each) => each.value !== 0);
        expect(
          sent,
          `morph: dead centre at centre ${c} the corners must send the ` +
            "shaped weight and nothing else",
        ).toEqual(expected.map((each) => `cc${each.cc}=${each.value}`));
        // 5. THE PAINT IS THE VALUE SENT, not the raw weight: the picture is
        //    what the DAW hears. All nine cells of every corner block sit at
        //    phase 2*z.
        for (let j = 0; j < 4; j += 1) {
          const phases = blockOf(K[j]).map(
            (cell) => sim.layer(hwOfCell(cell), 1).pha,
          );
          expect(
            [...new Set(phases)],
            `morph: corner ${j + 1}'s whole block is painted at the phase of ` +
              `the value it sent, at centre ${c}`,
          ).toEqual([shaped(CENTRE_W[j], c) * 2]);
        }
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        report.push(
          `dead centre at ${String(c).padStart(3)}: ` +
            (sent.length === 0 ? "silent" : sent.join(" ")),
        );
      } finally {
        host.close();
      }
    }

    // 6. THE CORNER AND ITS OPPOSITE, AT EVERY POSITION. One message, 127, on
    //    that corner's own controller; the other three are arithmetically 0
    //    inside the dead margin and were 0, so they say nothing at all.
    for (let index = 0; index < CENTRES.length; index += 1) {
      const c = CENTRES[index];
      for (const [corner, x, y] of [
        [0, 0, 0],
        [3, 127, 127],
      ] as const) {
        const { host } = await openAt(index);
        try {
          host.touchDown(0, x, y);
          host.tick();
          expect(
            host.midi.map((m) => `cc${m.p1}=${m.p2}`),
            `morph: at centre ${c} a press on (${x},${y}) must send 127 on ` +
              `corner ${corner + 1}'s controller and nothing else - the knob ` +
              "may not cost the card its full scale under the finger",
          ).toEqual([`cc${base + corner + 1}=127`]);
        } finally {
          host.close();
        }
      }
    }
    report.push("the two extreme corners: one message, 127, at every position");

    // 7. THE ONE-MESSAGE CORNER TAP SURVIVES THE SHAPING, and the non-vacuity
    //    is stated as a number: the probe is corner 1's block's inner cell,
    //    the point a finger aimed from the middle of the pad lands on, where
    //    an unguarded card sends one message per corner whose SHAPED weight
    //    is non-zero.
    const inner = (axis: "x" | "y"): number => {
      const raw = calibratedCoordinatesIn(2, axis);
      return raw[raw.length - 1];
    };
    const INNER: [number, number] = [inner("x"), inner("y")];
    expect(
      blockOf(K[0]),
      "morph: the inner-cell probe must be inside corner 1's own block",
    ).toContain(calibratedCell(INNER[0], INNER[1]));
    for (let index = 0; index < CENTRES.length; index += 1) {
      const c = CENTRES[index];
      const w = weightsAt(INNER[0], INNER[1]);
      const unguarded = w.filter((each) => shaped(each, c) !== 0).length;
      const { host } = await openAt(index);
      try {
        host.touchDown(0, INNER[0], INNER[1]);
        host.tick();
        expect(
          host.midi.map((m) => `cc${m.p1}=${m.p2}`),
          `morph: A CORNER TAP STILL SENDS ONE MIDI MESSAGE at centre ${c}. ` +
            `Unguarded this point is ${unguarded} message(s), from weights ` +
            `${w.join("/")} shaped to ` +
            w.map((each) => shaped(each, c)).join("/"),
        ).toEqual([`cc${base + 1}=${shaped(w[0], c)}`]);
        report.push(
          `inner-cell tap at ${String(c).padStart(3)}: 1 message of ` +
            `${unguarded} unguarded, cc${base + 1}=${shaped(w[0], c)}`,
        );
      } finally {
        host.close();
      }
    }

    // 8. AND THE WHOLE STREAM IS THE RAW WEIGHTS' STREAM THROUGH THE MAP. The
    //    diagonal below is the gesture the pinned literal above uses; here it
    //    is driven at EVERY knob position and compared with a stream computed
    //    from the raw weights through `shaped` and 11-08's send-on-change - so
    //    the default's equality is the identity's, and every other position is
    //    checked against arithmetic rather than against a capture.
    const streams: string[] = [];
    for (let index = 0; index < CENTRES.length; index += 1) {
      const c = CENTRES[index];
      const { host } = await openAt(index);
      try {
        const path: [number, number][] = [[64, 64]];
        for (let t = 65; t <= 127; t += 1) path.push([t, t]);
        host.touchDown(0, path[0][0], path[0][1]);
        host.tick();
        for (let at = 1; at < path.length; at += 1) {
          host.touchMove(0, path[at][0], path[at][1]);
          host.tick();
        }
        // The corner branch cannot fire - the onset is the centre cell - so
        // every accepted sample sends every corner whose shaped value moved.
        const last = [0, 0, 0, 0];
        const want: string[] = [];
        for (const [x, y] of path)
          weightsAt(x, y).forEach((raw, j) => {
            const z = shaped(raw, c);
            if (z !== last[j]) {
              last[j] = z;
              want.push(`${base + j + 1}:${z}`);
            }
          });
        const got = host.midi.map((m) => `${m.p1}:${m.p2}`);
        expect(
          got.join(" "),
          `morph: the diagonal at centre ${c} must be the raw weights through ` +
            "the map and 11-08's send-on-change, message for message",
        ).toBe(want.join(" "));
        streams.push(`${String(c).padStart(3)}: ${got.length} messages`);
        if (c === BREAK)
          expect(
            got.length,
            "morph: and at the default it is the 120-message stream the " +
              "pinned literal above holds byte for byte",
          ).toBe(120);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    report.push(`the diagonal, per position: ${streams.join("  ")}`);

    process.stdout.write(
      "\nMORPH's centre value (change 9, 2026-09-18):\n  " +
        report.join("\n  ") +
        "\n",
    );
    expect(
      report.length,
      "five positions reported three times, plus the rejection, the corners and the strokes",
    ).toBe(CENTRES.length * 3 + 3);
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

  it("keeps ARC stopped under a wobbling finger, still tracking, and resumes at the exact rate", async () => {
    // THE BENCH NOTE: "MIDI stops reliably but the visual on ZONA doesn't."
    //
    // Both halves are true and they are one line of code apart. The stop tap
    // sets s.s = 0 and writes F(0); the very next line of the same handler
    // recomputes r = 1 + x*31//127 on EVERY live code and re-arms layer 2 at
    // s.f whenever r changed. Probe A question 1, measured on the user's own
    // module, read a resting contact emitting a MOVE every sample - so the
    // first jitter MOVE after the stop put the swirl back while s.s stayed 0,
    // and the Timer's phase step (s.h + s.r*s.s) held the CC still. Quiet
    // wire, turning pad.
    //
    // THE PREVIEW COULD NOT SHOW IT, which is why 11-09.1's stop/resume test
    // above is green and this one was needed: a click delivers a DOWN and an
    // UP and no MOVE at all, so nothing in a browser ever reached the branch.
    // The gesture below is therefore the one a browser cannot make, driven
    // through the real Lua VM.
    //
    // THE WOBBLE STAYS INSIDE CELL 40, which is the whole point: r is a
    // 31-step map of x rather than a cell, and cell 40 spans x 57..71, which
    // is r 14 to 18. An in-cell wobble IS a real rate change, so no cell-level
    // hysteresis - the touch library's included (plan 12-07) - can answer this.
    const entry = entryById("arc");
    const cc = knobValueOf(entry, "cc");
    const cellOf = (x: number, y: number): number =>
      Math.floor((x * 9) / 128) + Math.floor((y * 9) / 128) * 9;
    const rateOf = (r: number): number => Math.min(120, Math.max(1, r >> 1));
    // Both points are inside cell 40 and land on DIFFERENT rate steps.
    const STOP_X = 60;
    const WOBBLE_X = 68;
    const Y = 60;
    const RESUME_AT = 65;
    const STOP_R = 1 + Math.floor((STOP_X * 31) / 127);
    const WOBBLE_R = 1 + Math.floor((WOBBLE_X * 31) / 127);
    const report: string[] = [];

    const { host, sim } = await open(entry);
    try {
      // The swirl's 72 cells: column 8 is the offset fader since change 6 (2026-09-17) and
      // its layer 2 is painted black with no rate, so it is not the swirl's to turn.
      const rates = (): number[] => {
        const out: number[] = [];
        for (let cell = 0; cell < 81; cell += 1)
          if (cell % 9 !== 8) out.push(sim.layer(hwOfCell(cell), 2).fre);
        return out;
      };
      const distinctRates = (): number[] => [...new Set(rates())].sort();
      const emitted = (from: number): number[] =>
        host.midi
          .slice(from)
          .filter((m) => m.p1 === cc)
          .map((m) => m.p2);

      // The probe's own arithmetic, checked before it is relied on.
      for (const x of [STOP_X, WOBBLE_X, RESUME_AT])
        expect(
          cellOf(x, x === RESUME_AT ? RESUME_AT : Y),
          `arc: the wobble must stay inside the centre cell; x=${x} is not`,
        ).toBe(40);
      expect(
        WOBBLE_R,
        "arc: the wobble must cross a rate step, or it tests nothing",
      ).not.toBe(STOP_R);

      // 0. RUNNING. Non-vacuity for everything below.
      let from = host.midi.length;
      host.run(100);
      const running = emitted(from);
      const runningRates = distinctRates();
      expect(
        new Set(running).size,
        "arc: the controller must be moving before the stop, or the flat " +
          "stretch below compares two still pictures",
      ).toBeGreaterThan(1);
      expect(
        runningRates.every((rate) => rate > 0),
        `arc: the swirl must be turning before the stop. Rates ` +
          `[${runningRates.join(", ")}]`,
      ).toBe(true);

      // 1. THE STOP TAP, at cell 40. DOWN, and the finger STAYS DOWN through
      //    the wobble below (the lift is after step 3): the shape a still finger
      //    makes, and since change 6 (2026-09-17) the roles are per contact, so
      //    a MOVE from a lifted contact is nobody's. The toggle rides the onset edge.
      host.touchDown(0, STOP_X, Y);
      host.tick();
      const afterStop = distinctRates();
      expect(
        afterStop,
        `arc: the stop tap must freeze the swirl. Rates [${afterStop.join(
          ", ",
        )}]`,
      ).toEqual([0]);

      // 2. THE WOBBLE. One MOVE, inside the same cell, on a different rate
      //    step - exactly what a still finger produces at 100 Hz. THIS IS THE
      //    ASSERTION THE FIX EXISTS FOR: unpatched, the rate branch calls
      //    F(s.f) here and every one of the 81 cells comes back at
      //    glim(17//2,1,120) = 8 while s.s is still 0.
      host.touchMove(0, WOBBLE_X, Y);
      host.tick();
      const afterWobble = distinctRates();
      report.push(
        `stopped at x=${STOP_X} (r ${STOP_R}), wobbled to x=${WOBBLE_X} ` +
          `(r ${WOBBLE_R}): swirl rates [${afterWobble.join(", ")}]`,
      );
      expect(
        afterWobble,
        "arc: A STOPPED ARC MUST STAY STOPPED UNDER A WOBBLING FINGER. The " +
          'bench note is "MIDI stops reliably but the visual on ZONA ' +
          "doesn't\". A still finger sends a MOVE every sample, and r is a " +
          "31-step map of x, so the first wobble crosses a rate step and the " +
          "unpatched rate branch re-arms layer 2 at " +
          `glim(${WOBBLE_R}//2,1,120) = ${rateOf(WOBBLE_R)} while s.s is ` +
          "still 0. The gate is `if s.s>0 then F(s.f)end`. Observed rates " +
          `[${afterWobble.join(", ")}]`,
      ).toEqual([0]);

      // 3. THE DRAG STILL TRACKS, read out of the VM's own `self` rather than
      //    inferred from what the resume happens to write. This is what the
      //    +18 gate buys over the +25 alternative ("if s.s<1 then return end"
      //    ahead of the branch), which would leave all three of these at the
      //    values Setup gave them.
      const trackedR = host.selfNumber("r");
      const trackedF = host.selfNumber("f");
      const trackedD = host.selfNumber("d");
      const trackedS = host.selfNumber("s");
      report.push(
        `while stopped: self.s ${trackedS}, self.r ${trackedR}, ` +
          `self.f ${trackedF}, self.d ${trackedD}`,
      );
      expect(
        trackedS,
        "arc: the card must still be stopped after the wobble",
      ).toBe(0);
      expect(
        trackedR,
        "arc: A STOPPED ARC MUST GO ON TRACKING THE DRAG, or the resume " +
          "hands back the rate the stop froze rather than the rate the " +
          `finger asked for. self.r must follow the wobble to ${WOBBLE_R}`,
      ).toBe(WOBBLE_R);
      expect(
        trackedF,
        "arc: self.f carries the rate the resume restores, so it must follow " +
          "self.r while the card is stopped",
      ).toBe(rateOf(WOBBLE_R));
      expect(
        trackedD,
        "arc: the depth tracks while stopped too - s.d = 127 - y, and the " +
          `wobble sat at y=${Y}`,
      ).toBe(127 - Y);

      host.touchUp(0, WOBBLE_X, Y);
      host.tick();

      // 4. AND IT STAYS STOPPED, for a whole second, on both observables.
      from = host.midi.length;
      host.run(100);
      const held = emitted(from);
      const heldRates = distinctRates();
      report.push(
        `held for 100 ticks: ${held.length} msg, ${new Set(held).size} ` +
          `distinct, swirl rates [${heldRates.join(", ")}]`,
      );
      expect(
        held.length,
        "arc: a stopped ARC goes on sending, deliberately - a silent stop " +
          "would be indistinguishable from a Timer that raised",
      ).toBeGreaterThan(40);
      expect(
        new Set(held).size,
        `arc: the stop must hold for the whole wait. Observed ` +
          `${new Set(held).size} distinct controller value(s)`,
      ).toBe(1);
      expect(
        heldRates,
        `arc: the swirl must still be frozen a second later. Rates ` +
          `[${heldRates.join(", ")}]`,
      ).toEqual([0]);

      // 5. THE EXACT RESUME. A second tap at cell 40 writes F(s.f), and s.f
      //    is the rate the WOBBLE asked for - not the 4 Setup armed and not
      //    the rate the stop froze.
      host.touchDown(0, RESUME_AT, RESUME_AT);
      host.tick();
      host.touchUp(0, RESUME_AT, RESUME_AT);
      host.tick();
      const resumedRates = distinctRates();
      report.push(
        `resumed with a tap at cell 40: swirl rates ` +
          `[${resumedRates.join(", ")}]`,
      );
      expect(
        resumedRates,
        "arc: THE RESUME MUST BE EXACT. The drag moved the rate to " +
          `r=${WOBBLE_R} while the card was stopped, so the resume writes ` +
          `glim(${WOBBLE_R}//2,1,120) = ${rateOf(WOBBLE_R)} - not the 4 ` +
          "Setup armed the swirl at, and not the rate the stop froze. " +
          `Observed [${resumedRates.join(", ")}]`,
      ).toEqual([rateOf(WOBBLE_R)]);

      from = host.midi.length;
      host.run(100);
      expect(
        new Set(emitted(from)).size,
        "arc: the controller must move again after the resume",
      ).toBeGreaterThan(1);
    } finally {
      host.close();
    }

    process.stdout.write(
      "\nARC under a wobbling finger, plan 12-05:\n  " +
        report.join("\n  ") +
        "\n",
    );
    expect(report.length, "every stage of the wobble probe ran").toBe(4);
  }, 120000);

  it("runs ARC as an LFO: six waves over one cycle, the offset fader on column 8 live in every state, two contacts by role, the stop tap on cell 40 and not on the column", async () => {
    // Change 6 (2026-09-17, BENCH-2026-09-16.txt section 6). The observable
    // for `v` is layer 1's phase on the heart's centre cell: Setup arms layer 1
    // with glp alone, the heart is painted at v*s.d//127 and s.d is 127 until a
    // finger moves it, so the phase IS v. The CC is read off the host's log and
    // compared with the entry's own formula over that v, offset included.
    const entry = entryById("arc");
    const cc = knobValueOf(entry, "cc");
    const shape = entry.knobs.find((knob) => knob.id === "shape");
    expect(shape, "arc carries the wave-shape knob").toBeDefined();
    if (!shape) return;
    const WORDS = [
      "Sine",
      "Saw up",
      "Saw down",
      "Triangle",
      "Square",
      "Random",
    ];
    expect(shape.values, "six waves").toHaveLength(6);
    expect(
      shape.values.map((literal) => wordFor(shape.kind, literal)),
      "every wave is worded, in Ableton's order",
    ).toEqual(WORDS);
    expect(
      widgetFor(shape.kind, shape.values),
      "six worded options are a select (13-09's 4/5 boundary)",
    ).toBe("select");
    expect(entry.defaults.shape, "Triangle is the default, index 3").toBe(3);
    expect(shape.values[3]).toBe("255-math.abs(p*2-255)");

    const RATE = 4; // s.r at Setup: 64 Timer calls per cycle.
    const CYCLE = 256 / RATE;
    const clamp = (n: number): number => Math.min(127, Math.max(0, n));
    // The entry's own CC formula: glim(64+(v-128)*s.d//255+63-s.u*127//512,0,127).
    const ccOf = (v: number, d: number, u: number): number =>
      clamp(
        64 +
          Math.floor(((v - 128) * d) / 255) +
          63 -
          Math.floor((u * 127) / 512),
      );
    const wave: Record<number, (p: number) => number> = {
      0: (p) =>
        128 +
        (1 - Math.floor(p / 128) * 2) *
          Math.floor(((p % 128) * (128 - (p % 128)) * 127) / 4096),
      1: (p) => p,
      2: (p) => 255 - p,
      // The old Timer's `p<128 and p*2 or 510-p*2`, byte for byte.
      3: (p) => (p < 128 ? p * 2 : 510 - p * 2),
      4: (p) => 255 - Math.floor(p / 128) * 255,
    };

    async function openWith(indices: Record<string, number>) {
      const { setup, timer } = renderLua(entry, indices);
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer,
      });
      return { host, sim };
    }
    type Opened = Awaited<ReturnType<typeof openWith>>;
    /** Tick until the Timer has sent one more controller message; return it. */
    const nextTimer = ({ host }: Opened): HostMidi => {
      const before = host.midi.length;
      for (let t = 0; t < 4 && host.midi.length === before; t += 1) host.tick();
      const sent = host.midi.slice(before).filter((m) => m.p1 === cc);
      expect(sent, "one Timer call sends exactly one controller").toHaveLength(
        1,
      );
      return sent[0];
    };
    const heartV = ({ sim }: Opened): number => sim.layer(hwOfCell(40), 1).pha;
    const columnDark = ({ sim }: Opened): boolean =>
      [0, 1, 2, 3, 4, 5, 6, 7, 8].every((row) => {
        const layer = sim.layer(hwOfCell(8 + row * 9), 2);
        return (
          layer.max.every((c) => c === 0) &&
          layer.mid.every((c) => c === 0) &&
          layer.fre === 0
        );
      });
    const litCellsInColumn = ({ sim }: Opened): number[] =>
      [0, 1, 2, 3, 4, 5, 6, 7, 8]
        .map((row) => 8 + row * 9)
        .filter((cell) => sim.layer(hwOfCell(cell), 1).pha > 0);
    const report: string[] = [];

    // A. THE SIX WAVES. One cycle each at the Setup rate; v read per Timer call.
    for (let index = 0; index < 5; index += 1) {
      const opened = await openWith({ ...entry.defaults, shape: index });
      try {
        let peak = { p: -1, v: -1 };
        for (let k = 1; k <= CYCLE; k += 1) {
          const p = (RATE * k) % 256;
          const sent = nextTimer(opened);
          const v = heartV(opened);
          expect(
            v,
            `arc ${WORDS[index]}: v at p=${p} is the wave's own formula`,
          ).toBe(wave[index](p));
          expect(
            sent.p2,
            `arc ${WORDS[index]}: the CC at p=${p} is the formula over v, offset 0`,
          ).toBe(ccOf(v, 127, 256));
          if (v > peak.v) peak = { p, v };
        }
        expect(opened.host.errors, opened.host.errors.join(" | ")).toEqual([]);
        report.push(`${WORDS[index]}: peak v ${peak.v} at p=${peak.p}`);
        if (index === 0) {
          expect(peak, "arc Sine: peaks at 255 at p=64").toEqual({
            p: 64,
            v: 255,
          });
        }
      } finally {
        opened.host.close();
      }
    }
    // Random: held for a whole cycle, a new value on the wrap.
    {
      const opened = await openWith({ ...entry.defaults, shape: 5 });
      try {
        // v per Timer call over six cycles: it may change only where p wraps to 0.
        const cycles: number[] = [];
        let last = -1;
        for (let k = 1; k <= 6 * CYCLE; k += 1) {
          const p = (RATE * k) % 256;
          nextTimer(opened);
          const v = heartV(opened);
          if (p === 0) cycles.push(v);
          else if (k > 1)
            expect(
              v,
              `arc Random: held inside the cycle (S&H), not one value per tick; moved at p=${p}`,
            ).toBe(last);
          last = v;
        }
        expect(cycles, "six wraps seen").toHaveLength(6);
        expect(
          new Set(cycles).size,
          `arc Random: a new value on the wrap; cycles [${cycles.join(", ")}]`,
        ).toBeGreaterThanOrEqual(4);
        for (const v of cycles) expect(v).toBeGreaterThanOrEqual(0);
        for (const v of cycles) expect(v).toBeLessThanOrEqual(255);
        report.push(`Random: six cycles held [${cycles.join(", ")}]`);
      } finally {
        opened.host.close();
      }
    }

    // B. THE OFFSET FADER, at the defaults (Triangle).
    const X8 = ledCentre(8, "x");
    const TOP = 0;
    const BOTTOM = 127;
    const CENTRE = ledCentre(4, "y");
    for (const y of [TOP, BOTTOM, CENTRE])
      expect(
        calibratedCell(X8, y) % 9,
        `arc: the probe at (${X8}, ${y}) must be in column 8`,
      ).toBe(8);
    const opened = await openWith({ ...entry.defaults });
    const { host, sim } = opened;
    try {
      const u = (): number => host.selfNumber("u") ?? -1;
      const rate = (): number => host.selfNumber("r") ?? -1;
      const running = (): number => host.selfNumber("s") ?? -1;
      const swirlRate = (): number => sim.layer(hwOfCell(0), 2).fre;

      // At rest: column 8 dark on layer 2, the marker at cell 44 (u 256, offset 0).
      nextTimer(opened);
      expect(
        columnDark(opened),
        "arc: column 8 is black on layer 2 at rest",
      ).toBe(true);
      expect(
        litCellsInColumn(opened),
        "arc: the marker rests at cell 44",
      ).toEqual([44]);
      expect(u(), "arc: no offset at Setup").toBe(256);

      // Running: top gives +63, bottom -64, centre 0, each on the next tick.
      host.touchDown(0, X8, TOP);
      host.tick();
      let sent = nextTimer(opened);
      expect(u(), "arc: the top of the column is u 0").toBe(0);
      expect(sent.p2, "arc: +63 on the next tick while running").toBe(
        ccOf(heartV(opened), 127, 0),
      );
      expect(
        litCellsInColumn(opened),
        "arc: the marker follows to cell 8",
      ).toEqual([8]);
      host.touchMove(0, X8, BOTTOM);
      host.tick();
      sent = nextTimer(opened);
      expect(u(), "arc: the bottom of the column is u 512").toBe(512);
      expect(sent.p2, "arc: -64 on the next tick").toBe(
        ccOf(heartV(opened), 127, 512),
      );
      expect(litCellsInColumn(opened), "arc: the marker at cell 80").toEqual([
        80,
      ]);
      host.touchMove(0, X8, CENTRE);
      host.tick();
      sent = nextTimer(opened);
      expect(u(), "arc: the centre LED is u 256, offset 0").toBe(256);
      expect(sent.p2, "arc: the centre is today's stream").toBe(
        ccOf(heartV(opened), 127, 256),
      );
      expect(
        columnDark(opened),
        "arc: column 8 stays black under the finger",
      ).toBe(true);
      // Held after the lift.
      host.touchMove(0, X8, TOP);
      host.tick();
      host.touchUp(0, X8, TOP);
      host.tick();
      for (let k = 0; k < 10; k += 1) {
        sent = nextTimer(opened);
        expect(sent.p2, "arc: the offset holds after the lift").toBe(
          ccOf(heartV(opened), 127, 0),
        );
      }
      expect(u(), "arc: a fader keeps its value").toBe(0);
      expect(running(), "arc: a fader touch never stops the card").toBe(1);
      report.push(
        "fader: top +63, bottom -64, centre 0, held +63 after the lift",
      );

      // A tap on column 8 is the fader, never the stop tap.
      host.touchDown(0, X8, CENTRE);
      host.tick();
      host.touchUp(0, X8, CENTRE);
      host.tick();
      expect(running(), "arc: a tap on cell 44 does not stop the card").toBe(1);
      expect(u(), "arc: the tap set the offset to 0").toBe(256);

      // Stopped: the held CC moves with the fader.
      host.touchDown(0, 60, 60);
      host.tick();
      host.touchUp(0, 60, 60);
      host.tick();
      expect(running(), "arc: the centre tap stops the card").toBe(0);
      const frozen = nextTimer(opened).p2;
      const frozenV = heartV(opened);
      expect(nextTimer(opened).p2, "arc: stopped, the CC holds").toBe(frozen);
      host.touchDown(0, X8, BOTTOM);
      host.tick();
      sent = nextTimer(opened);
      expect(heartV(opened), "arc: the phase stays frozen").toBe(frozenV);
      expect(
        sent.p2,
        "arc: the held CC moves with the fader while stopped",
      ).toBe(ccOf(frozenV, 127, 512));
      expect(sent.p2).not.toBe(frozen);
      host.touchUp(0, X8, BOTTOM);
      host.tick();
      host.touchDown(0, 60, 60);
      host.tick();
      host.touchUp(0, 60, 60);
      host.tick();
      expect(running(), "arc: the second centre tap resumes").toBe(1);
      report.push(
        `stopped: CC ${frozen} -> ${sent.p2} under the fader at the bottom`,
      );

      // Two contacts by role: the fader first (id 0), the rate finger second (id 1).
      host.touchMove(0, X8, TOP); // nobody's: contact 0 has lifted
      host.tick();
      host.touchDown(0, X8, TOP);
      host.tick();
      host.touchDown(1, 100, 30);
      host.tick();
      expect(rate(), "arc: the second finger drives the rate").toBe(
        1 + Math.floor((100 * 31) / 127),
      );
      expect(host.selfNumber("d"), "arc: and the depth").toBe(127 - 30);
      expect(swirlRate(), "arc: the swirl follows").toBe(
        Math.min(
          120,
          Math.max(1, Math.floor((1 + Math.floor((100 * 31) / 127)) / 2)),
        ),
      );
      expect(u(), "arc: the fader is unaffected by the rate drag").toBe(0);
      sent = nextTimer(opened);
      expect(sent.p2, "arc: the CC carries the offset under both fingers").toBe(
        ccOf(heartV(opened), 127 - 30, 0),
      );
      // The fader lifts first; the rate finger keeps its role.
      host.touchUp(0, X8, TOP);
      host.tick();
      host.touchMove(1, 20, 30);
      host.tick();
      expect(
        rate(),
        "arc: the rate finger is not dropped when the fader lifts",
      ).toBe(1 + Math.floor((20 * 31) / 127));
      expect(u(), "arc: the fader holds after its lift").toBe(0);
      // A second finger in the playing area is ignored, its centre tap included.
      host.touchDown(0, 10, 10);
      host.tick();
      expect(rate(), "arc: a second playing finger is ignored").toBe(
        1 + Math.floor((20 * 31) / 127),
      );
      host.touchUp(0, 10, 10);
      host.tick();
      host.touchDown(0, 60, 60);
      host.tick();
      host.touchUp(0, 60, 60);
      host.tick();
      expect(running(), "arc: a second finger's centre tap does not stop").toBe(
        1,
      );
      host.touchUp(1, 20, 30);
      host.tick();
      // Both on the fader: the later wins; the first stays ignored after it.
      host.touchDown(0, X8, TOP);
      host.tick();
      host.touchDown(1, X8, BOTTOM);
      host.tick();
      expect(u(), "arc: two fingers on the fader - the later wins").toBe(512);
      host.touchMove(0, X8, CENTRE);
      host.tick();
      expect(
        u(),
        "arc: the first fader finger is ignored while the later holds",
      ).toBe(512);
      host.touchUp(1, X8, BOTTOM);
      host.tick();
      host.touchMove(0, X8, TOP);
      host.tick();
      expect(u(), "arc: and stays ignored after the later lifts").toBe(512);
      host.touchUp(0, X8, TOP);
      host.tick();
      // The swirl finger first (id 0), the fader second (id 1).
      host.touchDown(0, 100, 30);
      host.tick();
      host.touchDown(1, X8, CENTRE);
      host.tick();
      expect(u(), "arc: the fader may be contact 1").toBe(256);
      host.touchMove(0, 20, 30);
      host.tick();
      expect(rate(), "arc: contact 0 keeps the rate beside the fader").toBe(
        1 + Math.floor((20 * 31) / 127),
      );
      host.touchUp(1, X8, CENTRE);
      host.tick();
      host.touchUp(0, 20, 30);
      host.tick();
      // A coalesced tap (code 9) on the fader sets the offset once and releases the role.
      host.touchTap(0, X8, BOTTOM);
      host.tick();
      expect(u(), "arc: a fast tap on the fader lands its height").toBe(512);
      host.touchDown(0, 100, 30);
      host.tick();
      expect(
        rate(),
        "arc: the same id is the swirl's again after the tap",
      ).toBe(1 + Math.floor((100 * 31) / 127));
      host.touchUp(0, 100, 30);
      host.tick();
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      report.push(
        "roles: fader 0 + rate 1, fader lifts first, later fader wins, rate 0 + fader 1, code 9 releases",
      );
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nARC AS AN LFO (change 6, 2026-09-17):\n  " +
        report.join("\n  ") +
        "\n",
    );
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

  it("carries LUMEN's depth knob all the way to the emitted bytes, downwards, only below the top row, and to exact black at its deepest", async () => {
    // THE BENCH NOTE THIS ANSWERS: "LUMEN ... the color depth / opacity doesn't
    // work", answered at the 11-09 checkpoint with "try it but we observed no
    // difference in the LEDs", and then again at 12-00 with "LUMEN: seems like
    // nothing changed".
    //
    // THE OPTION THAT NOTE WAS COSTED FROM QUOTED A RATIO. That figure is the
    // arithmetic d/32 and it is NOT a reading of a frame: between it and a lit
    // LED sit glc's three colour stops, glp's phase, shapeIntensity, the
    // per-layer weights, the two-layer sum and the single divide by 512 with
    // its clamp at 255 (pad-sim.ts render()). So this test reads the FRAME.
    //
    // WHAT 11-09.2 FOUND AT SUBTRAHEND 36: the knob delivers. Four @DEPTH
    // values, four distinct 243-byte frames, column 0's bottom row walking
    // 196,69,0 -> 139,49,0 -> 84,29,0 -> 27,9,0. AND PROBE B FOUND THE SAME
    // THING ON THE USER'S OWN MODULE - four distinct brightness levels, with
    // the darkest "clearly lit". A step a person can look at and call
    // unchanged is still a delivered step, and that is exactly the problem.
    //
    // WHAT 12-11 CHANGED, AND WHAT THIS TEST NOW PINS: the subtrahend and the
    // divisor are both 32, so the bottom row's d is 24 / 16 / 8 / ZERO and the
    // deepest setting turns the bottom row OFF. Clause 2a is that zero,
    // asserted on emitted bytes rather than described, because an unlit LED is
    // the one picture nobody reports as "nothing changed".
    //
    // WHY "NO DIFFERENCE IN THE LEDS" IS STILL CONSISTENT WITH A WORKING KNOB.
    // The whole of the travel is in the LOWER rows. d = 32 - row*@DEPTH, so
    // ROW 0 IS d = 32 AT EVERY VALUE AND CANNOT MOVE - that is arithmetic, not
    // a defect - and the worst channel spread across all four values climbs
    // 0, 24, 48, 72, 95, 119, 143, 167, 189 from row 0 to row 8. The shipped
    // default is index 2 of 4. A person watching the top of the pad while
    // turning the knob is reporting what the pad does, which is why the card's
    // own quiet line now names the anchor row (listing.ts).
    //
    // ASSERTED AS RELATIONS, NEVER AS BRIGHTNESS LITERALS - with clause 2a as
    // the one deliberate exception, because ZERO is not a brightness literal,
    // it is the floor of the scale and the deliverable. Everything else
    // survives a future re-cut of the four values or of the divisor and only a
    // DECOUPLING - or an inversion - reddens it. Clause 4 is the travel bound
    // made permanent: 8*max(@DEPTH) has to stay inside the subtrahend OR THE
    // BOTTOM ROW GOES NEGATIVE and truncates to garbage, while 8*(max+1) has to
    // exceed it or the knob is not at full travel. Both are still true at 32,
    // with the first now holding AT EQUALITY - which is what black means here.
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
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
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

    // 1. ROW 0 CANNOT MOVE, AND THAT IS ARITHMETIC. d = 32 - 0*@DEPTH = 32 at
    //    every value of the knob, so the top row is the anchor colour whatever
    //    the knob says. Stated out loud because a user looking at the top of
    //    the pad while turning the knob would correctly report seeing nothing.
    for (let col = 0; col < GRID_W; col += 1) {
      const seen = new Set(frames.map((f) => tripleAt(f, col, 0)));
      expect(
        [...seen],
        `lumen: ROW 0 IS THE ANCHOR AT EVERY @DEPTH - d = 32 - 0*@DEPTH is ` +
          `32 for all of ${values.join(", ")}. Column ${col} row 0 rendered ` +
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

    // 2a. AND AT THE DEEPEST VALUE THE BOTTOM ROW IS EXACTLY BLACK, IN EVERY
    //     COLUMN AND EVERY CHANNEL (plan 12-11). d = 32 - 8*max(@DEPTH) = 0, so
    //     every channel is anchor*0//32 and the whole row is unlit. This is the
    //     one clause in this test that asserts a literal, and the literal is
    //     zero: the user reported "nothing changed" twice at subtrahend 36,
    //     where the deepest bottom row was 27,9,0 and Probe B confirmed 27 is
    //     CLEARLY LIT on the desk. A dark LED is not a dim one, and this is the
    //     assertion that says the deepest setting is unmistakable.
    const deepestIndex = values.length - 1;
    const bottomRow = Array.from({ length: GRID_W }, (_, col) =>
      tripleAt(frames[deepestIndex], col, BOTTOM),
    );
    const bottomChannels = Array.from({ length: GRID_W }, (_, col) =>
      CHANNELS.map((_ch, k) => channelAt(frames[deepestIndex], col, BOTTOM, k)),
    ).flat();
    expect(
      bottomChannels,
      `lumen: AT @DEPTH ${values[deepestIndex]} THE BOTTOM ROW MUST BE ` +
        `EXACTLY BLACK in all ${GRID_W} columns - ${GRID_W - 1}*` +
        `${values[deepestIndex]} IS the subtrahend, so d is zero there and ` +
        "every channel is anchor*0//<subtrahend>. Clause 4 below pins that " +
        "equality to the entry's own Lua. The row rendered " +
        bottomRow.join("  "),
    ).toEqual(Array.from({ length: GRID_W * CHANNELS.length }, () => 0));
    // And it is the ONLY row that goes out, so the card is a ramp rather than
    // a card that turns itself off: row 7 at the same value must still be lit
    // wherever row 0 is.
    for (let col = 0; col < GRID_W; col += 1) {
      if (tripleAt(frames[deepestIndex], col, 0) === "0,0,0") continue;
      expect(
        tripleAt(frames[deepestIndex], col, BOTTOM - 1),
        `lumen: at @DEPTH ${values[deepestIndex]} the row ABOVE the bottom ` +
          `must still be lit in column ${col}, or the knob is blanking the ` +
          "pad rather than deepening the ramp",
      ).not.toBe("0,0,0");
    }
    // ROW 0 IS BYTE-IDENTICAL AT EVERY INDEX, asserted over the whole row's
    // bytes at once rather than column by column - clause 1 proves each column
    // separately, and this proves the row as a run of bytes, which is the form
    // the bench is asked to compare against (docs/HARDWARE-AUDITION.md).
    const rowBytes = (frame: Uint8Array, row: number): string =>
      Array.from({ length: GRID_W }, (_, col) =>
        tripleAt(frame, col, row),
      ).join(" ");
    const topRows = new Set(frames.map((f) => rowBytes(f, 0)));
    expect(
      [...topRows],
      "lumen: ROW 0 IS THE ANCHOR AND THE WHOLE ROW MUST BE BYTE-IDENTICAL " +
        "at every knob index - it is what the card's quiet line tells a " +
        "visitor to read the rest of the pad against",
    ).toHaveLength(1);

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
          `d = 32 - row*@DEPTH. Row ${row} spread ${spreads[row]} against ` +
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
    //
    //    EQUALITY IS ALLOWED AND IS WHAT SHIPS SINCE 12-11. At 32/32 the
    //    bottom row's d is exactly zero at the deepest value: black, not
    //    negative. The bound is `<=` and it always was; what changed is that
    //    the entry now sits ON it, which is what clause 2a reads in bytes.
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
      `lumen: 8*max(@DEPTH) = ${(GRID_W - 1) * deepest} must not exceed the ` +
        `subtrahend ${subtrahend}, or the bottom row's d goes negative and a ` +
        "channel TRUNCATES rather than clamping. EQUAL is legal and is what " +
        "ships: it makes the bottom row exactly black. The obvious " +
        "alternative form, anchor*(@DEPTH-row)//@DEPTH, is negative at " +
        "@DEPTH 6 and exactly black at 8 - see the entry header",
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

  it("sends LUMEN's colour as framed seven-bit hex over sysex once per colour, and its two axis CCs once per moved axis", async () => {
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
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
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
      const x0 = ledCentre(0, "x");
      const y0 = ledCentre(0, "y");
      const x8 = ledCentre(GRID_W - 1, "x");
      const y8 = ledCentre(GRID_W - 1, "y");
      host.touchDown(0, x0, y0);
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
      host.touchMove(0, x0 + 1, y0 + 1);
      host.tick();
      const afterIdleMove = host.sysex.length;

      // 3. A MOVE TO ANOTHER CELL SENDS THAT CELL'S COLOUR.
      host.touchMove(0, x8, y8);
      host.tick();
      seen.push({
        label: "move to cell 80",
        bytes: [...(host.sysex.at(-1)?.bytes ?? [])],
      });

      // 4. A FRESH CONTACT ON THE CELL ALREADY UNDER THE CURSOR SENDS AGAIN.
      //    `if n~=s.c or e>3` - e above 3 inside the shipped filter is a press
      //    or a fast tap. Without the second half a desk that missed the first
      //    message would need the finger to move to another cell and back.
      host.touchUp(0, x8, y8);
      host.tick();
      host.touchDown(0, x8, y8);
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

    // -----------------------------------------------------------------------
    // CLAUSE 6 - THE CURSOR THROUGH `Q`, AND THE TWO AXIS CCs THROUGH `A`
    // (plan 12-11). Extended into this test rather than added beside it,
    // because it is the same question this test already asks - what does one
    // gesture put on the wire - and because the sysex count and the CC count
    // are only meaningful against each other.
    //
    // WHAT IT IS FOR. Until 12-11 this entry read its cell as the naive
    // `x*9//128`, so Probe A's Q2 boundary - a finger resting on the line,
    // sending 71, 72, 71, 72 - flipped the cursor on every sample and RE-SENT
    // THE COLOUR each time; and it sent both axis CCs on every surviving
    // sample from outside every gate, which is the flood the probe's rule 3
    // names in those words. `Q` and `A` answer both.
    const report: string[] = [];
    {
      const ccKnob = entry.knobs.find((k) => k.id === "cc");
      const chKnob = entry.knobs.find((k) => k.id === "channel");
      expect(ccKnob, "lumen declares a cc knob").toBeDefined();
      expect(chKnob, "lumen declares a channel knob").toBeDefined();
      const CC = Number(ccKnob!.values[entry.defaults.cc ?? ccKnob!.default]);
      const CH = Number(
        chKnob!.values[entry.defaults.channel ?? chKnob!.default],
      );
      const CC_CMD = 176;
      const axis = (log: readonly HostMidi[]) =>
        log.filter((m) => m.cmd === CC_CMD && (m.p1 === CC || m.p1 === CC + 1));

      const host2 = await createLuaHost({
        sim: new PadSim(blankPadState()),
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer: timer.trim() === "" ? undefined : timer,
      });
      try {
        // 6a. A DOWN PRIMES AND SENDS NO CC. `A` gates on `e<4`, so the press
        //     records (x, y) in the library's `P[i]` and says nothing. This
        //     entry sent both CCs on the DOWN until 12-11.
        host2.touchDown(0, 60, 60);
        host2.tick();
        const onDown = axis(host2.midi);
        expect(
          onDown.map((m) => `cc${m.p1}=${m.p2}`),
          "lumen: a DOWN must send NO axis CC - `A` primes on the press and " +
            "the first CC of a gesture is its first MOVE",
        ).toEqual([]);
        report.push(`  DOWN (60,60)          ${onDown.length} CC`);

        // 6b. A MOVE THAT MOVES ONLY x SENDS ONLY THE x CC. This is the whole
        //     of rule 3 in one assertion, and the pre-plan entry sends two
        //     here.
        let mark = host2.midi.length;
        host2.touchMove(0, 61, 60);
        host2.tick();
        const movedX = axis(host2.midi.slice(mark));
        expect(
          movedX.map((m) => [m.ch, m.p1, m.p2]),
          `lumen: a MOVE from (60,60) to (61,60) must send EXACTLY ONE CC - ` +
            `controller ${CC} carrying x = 61 on channel ${CH}. y did not ` +
            "move, so the y CC must be silent",
        ).toEqual([[CH, CC, 61]]);
        report.push(
          `  MOVE x -> 61          ${movedX.length} CC: ` +
            movedX.map((m) => `cc${m.p1}=${m.p2}`).join(" "),
        );

        // 6c. A MOVE THAT MOVES ONLY y SENDS ONLY THE y CC, AND IT IS
        //     INVERTED. `A` sends `127-y` because the user's own bench snippet
        //     does (map_saturate(y, 0, 127, 127, 0)). ASSERTED rather than
        //     described: this is a wire change on controller CC + 1 and the
        //     day somebody "fixes" it back to raw y, this is what reddens.
        mark = host2.midi.length;
        host2.touchMove(0, 61, 62);
        host2.tick();
        const movedY = axis(host2.midi.slice(mark));
        expect(
          movedY.map((m) => [m.ch, m.p1, m.p2]),
          `lumen: a MOVE from (61,60) to (61,62) must send EXACTLY ONE CC - ` +
            `controller ${CC + 1} carrying 127 - 62 = 65, THE INVERSION the ` +
            "bench snippet asked for. x did not move, so the x CC is silent",
        ).toEqual([[CH, CC + 1, 127 - 62]]);
        report.push(
          `  MOVE y -> 62          ${movedY.length} CC: ` +
            movedY.map((m) => `cc${m.p1}=${m.p2}`).join(" "),
        );

        // 6d. A MOVE INSIDE ONE CELL STILL SENDS ITS MOVED AXIS. `Q` returns
        //     nil for this sample - the cell did not change - so an `A` placed
        //     INSIDE the `if n then ... end` block would send nothing at all.
        //     That is 12-VALIDATION R-4's trap, and this clause is the only
        //     thing standing between the fix and a silent controller.
        mark = host2.midi.length;
        const sysexMark = host2.sysex.length;
        host2.touchMove(0, 62, 62);
        host2.tick();
        const inCell = axis(host2.midi.slice(mark));
        expect(
          inCell.map((m) => [m.ch, m.p1, m.p2]),
          "lumen: a MOVE INSIDE ONE CELL must still send the axis that " +
            "moved. If this is empty, `A` has been put inside the cell gate " +
            "and the card's controllers only speak when the cursor moves",
        ).toEqual([[CH, CC, 62]]);
        expect(
          host2.sysex.length - sysexMark,
          "lumen: and that same in-cell MOVE must send NO sysex, because the " +
            "colour under the finger did not change",
        ).toBe(0);
        report.push(
          `  MOVE inside one cell  ${inCell.length} CC, ` +
            `${host2.sysex.length - sysexMark} sysex`,
        );
      } finally {
        host2.close();
      }

      // 6e. THE PROBE'S OWN BOUNDARY, SIX SAMPLES OF IT. Q2's trace is
      //     71, 72, 71, 72 on a finger that is not moving, and `71*9//128` is
      //     4 while `72*9//128` is 5. The naive cell flips on every sample;
      //     `Q`'s +-10 window holds it. ONE sysex for the whole gesture - the
      //     press - and not one more.
      const WOBBLE: readonly (readonly [number, number])[] = [
        [71, 64],
        [72, 64],
        [71, 64],
        [72, 65],
        [71, 65],
        [72, 65],
      ];
      const host3 = await createLuaHost({
        sim: new PadSim(blankPadState()),
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer: timer.trim() === "" ? undefined : timer,
      });
      try {
        host3.touchDown(0, WOBBLE[0][0], WOBBLE[0][1]);
        host3.tick();
        const pressSysex = host3.sysex.length;
        const pressMidi = host3.midi.length;
        expect(
          pressSysex,
          "lumen: the press that opens the gesture sends its colour once",
        ).toBe(1);
        for (const [x, y] of WOBBLE) {
          host3.touchMove(0, x, y);
          host3.tick();
        }
        expect(host3.errors, "lumen: the wobble must run clean").toEqual([]);
        expect(
          host3.sysex.length,
          `lumen: A FINGER RESTING ON A CELL LINE MUST NOT RE-SEND THE ` +
            `COLOUR. Six samples across the 71/72 boundary produced ` +
            `${host3.sysex.length - pressSysex} sysex message(s) after the ` +
            "press; the hysteresis in the library's `Q` is what holds the " +
            "cursor, and without it this card sends one per sample",
        ).toBe(1);

        // AND THE CC COUNT OVER THE SAME SIX SAMPLES, DERIVED FROM THE GESTURE
        // RATHER THAN TYPED: one CC per axis that actually moved, counted
        // against the DOWN's own (x, y) as the priming sample. The pre-plan
        // entry sends TWO per sample - twelve - because both `s:gms` calls sat
        // outside every gate. This is the number rule 3 is about.
        let expected = 0;
        for (let i = 0; i < WOBBLE.length; i += 1) {
          const previous = i === 0 ? WOBBLE[0] : WOBBLE[i - 1];
          if (WOBBLE[i][0] !== previous[0]) expected += 1;
          if (WOBBLE[i][1] !== previous[1]) expected += 1;
        }
        const wobbleCCs = axis(host3.midi.slice(pressMidi));
        expect(
          wobbleCCs.length,
          `lumen: the six-sample wobble must send ONE CC PER MOVED AXIS - ` +
            `${expected} of them - and not two per sample. It sent ` +
            `${wobbleCCs.length}: ` +
            wobbleCCs.map((m) => `cc${m.p1}=${m.p2}`).join(" "),
        ).toBe(expected);
        expect(
          wobbleCCs.length,
          "lumen: and that must be strictly fewer than the both-axes-every-" +
            "sample shape this replaced, or nothing was gained",
        ).toBeLessThan(2 * WOBBLE.length);
        report.push(
          `  71/72 wobble x6       ${wobbleCCs.length} CC (was 12), ` +
            `${host3.sysex.length - pressSysex} sysex after the press (was 5)`,
        );
      } finally {
        host3.close();
      }
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
        "\nLUMEN's cursor through Q and its axis CCs through A, plan 12-11:\n" +
        report.join("\n") +
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
    //
    // RE-AIMED AT THE MEASURED MAP BY PLAN 12.1-08a. GHOST's two cell sites
    // read the library's `N(x,y)` since that plan, so the drag is at the LED
    // centres from calibration.ts (KX / KY) and the cell arithmetic is the
    // library's nearest calibrated cell; until 12.1-08a this test drove the
    // naive ninths (`cellCentre`) and mirrored `x*9//128+y*9//128*9`. The
    // three claims are unchanged. The reset pixels are two raw points inside
    // LED (8,8)'s calibrated cell, asserted through the same arithmetic.
    const entry = entryById("ghost");
    const cc = knobValueOf(entry, "cc");
    /** The entry's own cell arithmetic since 12.1-08a: the library's N. */
    const cellOf = calibratedCell;
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

      const pathX = PATH_COLUMNS.map((column) => ledCentre(column, "x"));
      const pathY = ledCentre(PATH_ROW, "y");
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
        // round so the host's change gate cannot swallow the second one -
        // two raw points inside LED (8,8)'s calibrated cell, either side of
        // the outer knot (KX[8] = KY[8] = 126; the cell starts at 123 in x on
        // the measured map, so 125 and 123 are its two ends).
        const keyPoint = KX[8] + 1 - round * 2;
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
  // -------------------------------------------------------------------------
  // WHEELS - A PITCH WHEEL AND A MOD WHEEL ON ONE PAD (plan 11-15)
  //
  // THE ASK: "add a pitch and modwheel configs, leftside a pitchwheel rightside
  // a modwheel on the ZONA beautifully visualized on the module". The two
  // wheels are NOT the same control, and these two tests are what makes that a
  // fact rather than a layout:
  //
  //   - the pitch wheel SPRINGS HOME, on the wire as well as in the light, and
  //     the last bend it emits is EXACTLY 8192. Anything less and a held note
  //     stays bent after the finger is gone, which is the failure mode
  //     WHEELS-REQUEST.md names by itself.
  //   - the mod wheel HOLDS where it was left, and neither wheel appears on the
  //     other's stream.
  //
  // EVERY BOUNDARY IS READ OFF THE ENTRY'S OWN LUA - the centre literal, the
  // column split, the mod controller and the four spring rates - so a card
  // re-cut onto different columns moves these tests with it rather than
  // drifting past them.
  // -------------------------------------------------------------------------

  /** WHEELS' centre, its column split and its mod controller, from its Lua. */
  const wheelsGeometry = (): {
    entry: CatalogEntry;
    centre: number;
    split: number;
    cc: number;
    rates: number[];
  } => {
    const entry = entryById("wheels");
    const source = entry.source;
    if (source.kind !== "lua") throw new Error("wheels is not a lua entry");

    // THE CENTRE IS READ, NOT ASSUMED, and it is read from the TIMER - the
    // spring's own arithmetic - so a card that walked home to a different
    // number moves this test with it rather than failing for the wrong reason.
    const rest = /s\.b=(\d+)\+d/.exec(source.timer);
    expect(
      rest,
      "wheels: the spring must land on an EXACT LITERAL, the way the joystick " +
        "preset's compiled spring does - a scaled position cannot come home " +
        "bit-perfect",
    ).not.toBeNull();
    const centre = Number((rest as RegExpExecArray)[1]);

    // The onset column split: pitch below it, mod above it, the divider on it.
    const lock = /if c<(\d+) then/.exec(source.setup);
    expect(
      lock,
      "wheels: the onset must still split the pad by COLUMN, or the two " +
        "wheels are one control",
    ).not.toBeNull();
    const split = Number((lock as RegExpExecArray)[1]);

    // THE BEND STATUS IS READ OFF THE LUA. 224 is pitch bend; gmbs is a MOUSE
    // BUTTON, and a card built on that reading would compile, fit, simulate,
    // install and silently click.
    // Since change 17B the wheel's Type is a knob (Pitch bend by default, "224"): ONE sender,
    // defined by the Timer and pulled in by the Setup, sends the fourteen bits under 224, and both
    // halves - the finger in the Setup and the spring in the Timer - call it.
    const pitchType = entry.knobs.find((knob) => knob.id === "pitchType");
    expect(
      pitchType?.values[entry.defaults.pitchType ?? pitchType.default] ===
        "224" &&
        source.timer.includes("if t>223 then s:gms(@PCH,t,b%128,b//128)") &&
        source.timer.includes("P(s.b)") &&
        source.setup.includes("P(s.b)"),
      "wheels: BOTH halves of the pitch wheel must send PITCH BEND, status " +
        "224, through gms - the finger in the Setup and the spring in the " +
        "Timer. The channel is a knob token here, not a digit, which is why " +
        "this reads the argument slot rather than a literal",
    ).toBe(true);

    const rateKnob = entry.knobs.find((knob) => knob.id === "spring");
    expect(rateKnob, "wheels: the spring-speed knob").toBeDefined();

    return {
      entry,
      centre,
      split,
      cc: knobValueOf(entry, "cc"),
      rates: (rateKnob as LuaKnob).values.map((value) =>
        Number.parseInt(value, 10),
      ),
    };
  };

  /** One WHEELS host at a chosen spring-speed index. */
  const openWheels = async (entry: CatalogEntry, spring: number) => {
    const indices: Record<string, number> = {};
    for (const knob of entry.knobs) indices[knob.id] = knob.default;
    indices.spring = spring;
    const { setup, timer } = renderLua(entry, indices);
    const sim = new PadSim(blankPadState());
    return await createLuaHost({
      sim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup,
      timer,
    });
  };

  it("springs WHEELS' pitch home to exactly 8192, on the wire and in the light together", async () => {
    const g = wheelsGeometry();
    const report: string[] = [];

    // ---------------------------------------------------------------------
    // NO HID CALL SURVIVES ANY KNOB POSITION. gmbs, gmms and gks are the
    // compiler's mouse and keyboard out-calls; gmbs in particular is a MOUSE
    // BUTTON and not "bend send". A grep over the ENTRY FILE cannot prove
    // this - its header discusses gmbs by name, and a plant landing in a
    // comment is how 11-13 lost a negative check - so the assertion is over
    // the RENDERED LUA at every value of every knob, and the behavioural half
    // is below.
    // ---------------------------------------------------------------------
    const forbidden = ["gmbs", "gmms", "gks"];
    let renderings = 0;
    for (const knob of g.entry.knobs) {
      for (let i = 0; i < knob.values.length; i += 1) {
        const indices: Record<string, number> = {};
        for (const each of g.entry.knobs) indices[each.id] = each.default;
        indices[knob.id] = i;
        const rendered = renderLua(g.entry, indices);
        for (const event of ["setup", "timer"] as const) {
          for (const name of forbidden) {
            expect(
              rendered[event].includes(name),
              `wheels/${event} at ${knob.id}=${knob.values[i]}: "${name}" is ` +
                "an HID out-call. Pitch bend is status 224 through gms; a " +
                "configuration built on gmbs emits MOUSE CLICKS",
            ).toBe(false);
          }
        }
        renderings += 1;
      }
    }
    expect(
      renderings,
      "wheels: the HID scan examined every declared knob value, so a clean " +
        "result above is a measurement rather than an empty loop",
    ).toBe(g.entry.knobs.reduce((n, knob) => n + knob.values.length, 0));
    expect(g.split, "wheels: the pitch wheel owns the columns left of 4").toBe(
      4,
    );

    for (let rate = 0; rate < g.rates.length; rate += 1) {
      const host = await openWheels(g.entry, rate);
      try {
        const bright = (cell: number): number =>
          host.frame[cell * 3] +
          host.frame[cell * 3 + 1] +
          host.frame[cell * 3 + 2];
        const run = (n: number): void => {
          for (let i = 0; i < n; i += 1) host.tick();
        };
        const snap = (): number[] => {
          const out: number[] = [];
          for (let n = 0; n < CELLS; n += 1) out.push(bright(n));
          return out;
        };
        const bendOf = (m: HostMidi): number => m.p2 * 128 + m.p1;
        const markerRow = (): number => {
          let best = -1;
          let peak = -1;
          for (let r = 0; r < 9; r += 1) {
            const v = bright(r * 9);
            if (v > peak) {
              peak = v;
              best = r;
            }
          }
          return best;
        };

        run(RESIDUE_WARMUP);
        const boot = snap();
        const bootMarker = markerRow();

        // -----------------------------------------------------------------
        // BOTH REST STATES ARE VISIBLE AT POWER-ON, and the pitch marker sits
        // at the MIDDLE row. A card whose rest state is dark looks broken
        // before it is touched, and a pitch wheel resting anywhere but centre
        // is not a pitch wheel.
        // -----------------------------------------------------------------
        expect(
          bootMarker,
          "wheels: the pitch wheel rests at the MIDDLE row of its columns",
        ).toBe(4);
        expect(
          Math.min(...boot),
          "wheels: every cell is lit at power-on - both rails, the divider " +
            "and the marker - so restsBlack is false and the card does not " +
            "arrive as a black square",
        ).toBeGreaterThan(0);

        // THE DIVIDER IS A LINE, NOT MORE RAIL. Asserted as a RATIO and
        // naming no colour, because all three hues are knobs a visitor can
        // set to the same value (D-11-12-b, and 11-13's shape idiom).
        const divider = bright(4 * 9 + 4);
        const pitchRail = bright(0);
        const modRail = bright(6);
        expect(
          divider,
          "wheels: the divider must stand clear of BOTH rails, or the " +
            `boundary is invisible. Observed divider ${divider}, pitch rail ` +
            `${pitchRail}, mod rail ${modRail}`,
        ).toBeGreaterThan(Math.max(pitchRail, modRail) * 2);

        // -----------------------------------------------------------------
        // THE DRIVE. Every step MOVES ITS COORDINATE, because the host's own
        // change gate silently drops a repeated (event, x, y) per contact - a
        // probe built out of identical samples would be defeated by the host
        // rather than answered by the entry. That matters more here than
        // anywhere else in this file: a spring that returns to ONE value is
        // exactly the shape a change-gated probe cannot see.
        // -----------------------------------------------------------------
        const driveMark = host.midi.length;
        host.touchDown(0, 200, 511);
        host.tick();
        for (let y = 510; y >= 0; y -= 1) {
          host.touchMove(0, 200, y);
          host.tick();
        }
        const driven = host.midi.slice(driveMark);
        expect(
          driven.length,
          "wheels: driving the pitch wheel sent something at all",
        ).toBeGreaterThan(0);
        expect(
          [...new Set(driven.map((m) => m.cmd))],
          "wheels: THE PITCH WHEEL SENDS PITCH BEND AND NOTHING ELSE. " +
            `Observed ${JSON.stringify([...new Set(driven.map((m) => m.cmd))])}`,
        ).toEqual([224]);

        // FOURTEEN BITS, AND THE VALUE IS FINER THAN THE DISPLAY. Nine rows
        // of LEDs, and far more than nine values on the wire - the LEDs are
        // the readout, not the quantiser.
        const bends = driven.map(bendOf);
        expect(
          new Set(bends).size,
          "wheels: the bend must resolve FAR more than the nine rows it " +
            `draws. Observed ${new Set(bends).size} distinct values over ` +
            `${driven.length} messages`,
        ).toBeGreaterThan(400);
        expect(
          Math.max(...bends),
          "wheels: the bend reaches the TOP of its fourteen-bit range",
        ).toBe(16383);
        for (const message of driven) {
          expect(
            message.p1 >= 0 && message.p1 <= 127,
            `wheels: the bend's LOW byte is outside 0..127 (${message.p1})`,
          ).toBe(true);
          expect(
            message.p2 >= 0 && message.p2 <= 127,
            `wheels: the bend's HIGH byte is outside 0..127 (${message.p2})`,
          ).toBe(true);
        }
        expect(
          markerRow(),
          "wheels: the marker followed the finger to the top row",
        ).toBe(0);

        // -----------------------------------------------------------------
        // THE LIFT, AND THE SPRING. THIS IS THE TEST.
        // -----------------------------------------------------------------
        const springMark = host.midi.length;
        host.touchUp(0, 200, 0);
        host.tick();
        expect(
          host.timerArmed,
          "wheels: a lift on the pitch wheel ARMS the spring. Setup does not " +
            "arm the Timer, so nothing else could have",
        ).toBe(true);

        let ticks = 0;
        while (host.timerArmed && ticks < 4000) {
          host.tick();
          ticks += 1;
        }
        expect(
          host.timerArmed,
          "wheels: THE TIMER STOPS WHEN THE SPRING LANDS. A card that " +
            "re-arms for ever never releases its rAF slot",
        ).toBe(false);

        const spring = host.midi.slice(springMark);
        expect(
          spring.length,
          "wheels: the spring emitted something at all",
        ).toBeGreaterThan(0);
        expect(
          [...new Set(spring.map((m) => m.cmd))],
          "wheels: the spring emits PITCH BEND and nothing else",
        ).toEqual([224]);

        // THE ONE ASSERTION THIS WHOLE ENTRY EXISTS FOR.
        const landed = bendOf(spring[spring.length - 1]);
        expect(
          landed,
          "wheels: THE LAST BEND THE SPRING EMITS MUST BE EXACTLY " +
            `${g.centre}, not near it. Observed ${landed}, which is ` +
            `${landed - g.centre} away - a held note is still bent by that ` +
            "much after the finger has gone",
        ).toBe(g.centre);

        // AND THE LIGHT CAME HOME WITH IT, ASSERTED TOGETHER RATHER THAN ONE
        // STANDING IN FOR THE OTHER. The frame is compared BYTE FOR BYTE
        // against the boot frame, which also closes the one duplication in
        // this card: the Timer carries its own copy of the pitch repaint,
        // because a Timer body is a separate chunk and cannot see a Setup
        // local (snake.ts ships the same duplication for the same reason). A
        // Timer that repainted with a different rail phase, a different
        // marker phase or a different row derivation is red HERE.
        expect(
          markerRow(),
          "wheels: the pitch marker is back at the middle row",
        ).toBe(bootMarker);
        expect(
          snap(),
          "wheels: after the spring the WHOLE PAD is byte-identical to the " +
            "frame Setup painted. The Timer's copy of the pitch repaint and " +
            "Setup's original must agree exactly",
        ).toEqual(boot);

        // IT TRAVELS RATHER THAN SNAPPING. More than one step between the
        // released value and the centre, at every spring speed.
        expect(
          spring.length,
          `wheels: at rate ${g.rates[rate]} the spring must TRAVEL home ` +
            "rather than jump there in one message",
        ).toBeGreaterThan(1);

        // AND IT STAYS STOPPED. Nothing further on the wire, ever.
        const settled = host.midi.length;
        run(500);
        expect(
          host.midi.length - settled,
          "wheels: the spring is DONE. A Timer still walking would keep " +
            "sending bends at a pad nobody is touching",
        ).toBe(0);

        expect(
          host.hid,
          "wheels: NOT ONE HID SEND across the whole drive. gmbs is a mouse " +
            "button; a configuration that read it as 'bend send' would have " +
            "clicked here",
        ).toEqual([]);
        expect(
          host.errors,
          `wheels: no handler raised - ${host.errors.join(" | ")}`,
        ).toEqual([]);

        report.push(
          `  rate ${String(g.rates[rate]).padStart(4)}: drive ` +
            `${driven.length} messages, ${new Set(bends).size} distinct ` +
            `bends, max ${Math.max(...bends)}; spring ${spring.length} ` +
            `messages over ${ticks} ticks, ending ` +
            `${spring.slice(-3).map(bendOf).join(",")}; frame restored`,
        );
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nWHEELS spring, plan 11-15 (the last bend is the centre literal):\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);

  it("holds WHEELS' mod wheel across a lift, and lets neither wheel move the other", async () => {
    const g = wheelsGeometry();
    const spring = g.entry.knobs.find((knob) => knob.id === "spring");
    const host = await openWheels(g.entry, (spring as LuaKnob).default);
    const report: string[] = [];
    try {
      const bright = (cell: number): number =>
        host.frame[cell * 3] +
        host.frame[cell * 3 + 1] +
        host.frame[cell * 3 + 2];
      const run = (n: number): void => {
        for (let i = 0; i < n; i += 1) host.tick();
      };
      const markerRow = (): number => {
        let best = -1;
        let peak = -1;
        for (let r = 0; r < 9; r += 1) {
          const v = bright(r * 9);
          if (v > peak) {
            peak = v;
            best = r;
          }
        }
        return best;
      };
      const modColumn = (): number[] => {
        const out: number[] = [];
        for (let r = 0; r < 9; r += 1) out.push(bright(r * 9 + 6));
        return out;
      };
      const barHeight = (): number => {
        const column = modColumn();
        const rail = Math.min(...column);
        return column.filter((v) => v > rail).length;
      };
      const drive = (
        id: number,
        from: readonly [number, number],
        to: readonly [number, number],
        steps: number,
      ): readonly HostMidi[] => {
        const mark = host.midi.length;
        host.touchDown(id, from[0], from[1]);
        host.tick();
        for (let i = 1; i <= steps; i += 1) {
          host.touchMove(
            id,
            Math.round(from[0] + ((to[0] - from[0]) * i) / steps),
            Math.round(from[1] + ((to[1] - from[1]) * i) / steps),
          );
          host.tick();
        }
        return host.midi.slice(mark);
      };
      // A BOUNDED SETTLE, NEVER `while (host.timerArmed)`. A card whose
      // spring failed to land would make an unbounded loop HANG, and a hang is
      // not a red - it is a suite that never finishes and a reader who never
      // learns why. Measured: a plant that walks the bend to 8190 instead of
      // 8192 loops for ever, so this cap is the difference between a failing
      // assertion and a wedged run.
      const settle = (): void => {
        let ticks = 0;
        while (host.timerArmed && ticks < 4000) {
          host.tick();
          ticks += 1;
        }
        expect(
          host.timerArmed,
          "wheels: the spring SETTLED inside 4000 ticks. A spring that never " +
            "lands leaves the Timer armed for ever",
        ).toBe(false);
      };

      run(RESIDUE_WARMUP);

      // -------------------------------------------------------------------
      // THE MOD WHEEL RESTS AT ZERO AND SHOWS ITS RAIL. A fresh Setup leaves
      // it at the bottom of its range, which is a bar of no rows over a rail
      // that is still visible - not a black quarter of the pad.
      // -------------------------------------------------------------------
      expect(barHeight(), "wheels: the mod wheel rests at zero").toBe(0);
      expect(
        Math.min(...modColumn()),
        "wheels: and its rail is VISIBLE at rest, so the control exists " +
          "before it is touched",
      ).toBeGreaterThan(0);

      // -------------------------------------------------------------------
      // DRIVEN TO THE TOP AND BACK, so BOTH ends of its range are on the wire
      // in one direction or the other. The bottom end is not reachable in the
      // first direction because a drive that STARTS at zero is already at the
      // resting value and the entry's own change gate sends nothing - which
      // is correct, and is why both directions are driven.
      // -------------------------------------------------------------------
      const up = drive(1, [800, 1023], [800, 0], 1023);
      const down = drive(1, [800, 0], [800, 1023], 1023);
      const modded = [...up, ...down];
      expect(
        modded.length,
        "wheels: driving the mod wheel sent something at all",
      ).toBeGreaterThan(0);
      expect(
        [...new Set(modded.map((m) => m.cmd))],
        "wheels: THE MOD WHEEL SENDS CONTROL CHANGE AND NOTHING ELSE - no " +
          "bend. Observed " +
          JSON.stringify([...new Set(modded.map((m) => m.cmd))]),
      ).toEqual([176]);
      expect(
        [...new Set(modded.map((m) => m.p1))],
        `wheels: on controller ${g.cc} and no other`,
      ).toEqual([g.cc]);
      const values = modded.map((m) => m.p2);
      expect(
        Math.min(...values),
        "wheels: THE MOD WHEEL REACHES ZERO. A control that cannot reach one " +
          "end of its range is the defect CONSOLE shipped",
      ).toBe(0);
      expect(Math.max(...values), "wheels: and it reaches 127").toBe(127);
      for (const value of values) {
        expect(
          value >= 0 && value <= 127,
          `wheels: the mod wheel put ${value} on the wire, outside seven bits`,
        ).toBe(true);
      }

      // -------------------------------------------------------------------
      // AND NOW THE HALF THAT MAKES IT A MOD WHEEL RATHER THAN A SECOND PITCH
      // WHEEL: IT HOLDS.
      // -------------------------------------------------------------------
      const held = drive(1, [800, 1023], [800, 300], 723);
      expect(
        held.length,
        "wheels: the hold drive sent something",
      ).toBeGreaterThan(0);
      const restingValue = held[held.length - 1].p2;
      const restingBar = barHeight();
      expect(
        restingBar,
        "wheels: the mod bar is OPEN before the lift, or the assertion that " +
          "it did not move is vacuous",
      ).toBeGreaterThan(0);
      const holdMark = host.midi.length;
      host.touchUp(1, 800, 300);
      host.tick();
      run(SETTLE_TICKS + 500);
      const afterLift = host.midi.length - holdMark;
      const barAfterLift = barHeight();
      expect(
        host.midi.length - holdMark,
        "wheels: LIFTING OFF THE MOD WHEEL SENDS NOTHING. It stays where it " +
          "was left; only the pitch wheel has a spring",
      ).toBe(0);
      expect(
        barHeight(),
        `wheels: and its light did not move either - still ${restingBar} rows`,
      ).toBe(restingBar);
      expect(
        host.timerArmed,
        "wheels: a lift on the MOD wheel does not arm the spring at all",
      ).toBe(false);

      // -------------------------------------------------------------------
      // INDEPENDENCE, BOTH WAYS. This is what makes it two wheels rather than
      // an XY pad, which is the exact complaint STRIP drew.
      // -------------------------------------------------------------------
      const pitchOnly = drive(2, [100, 900], [100, 100], 800);
      expect(
        [...new Set(pitchOnly.map((m) => m.cmd))],
        "wheels: MOVING PITCH EMITS NOTHING ON MOD'S STREAM. Observed " +
          JSON.stringify([...new Set(pitchOnly.map((m) => m.cmd))]),
      ).toEqual([224]);
      expect(
        barHeight(),
        "wheels: and the mod bar did not move while pitch was driven",
      ).toBe(restingBar);
      host.touchUp(2, 100, 100);
      host.tick();
      settle();

      const markBefore = markerRow();
      const modOnly = drive(3, [900, 100], [900, 900], 800);
      expect(
        [...new Set(modOnly.map((m) => m.cmd))],
        "wheels: MOVING MOD EMITS NO BEND. Observed " +
          JSON.stringify([...new Set(modOnly.map((m) => m.cmd))]),
      ).toEqual([176]);
      expect(
        markerRow(),
        "wheels: and the pitch marker did not move while mod was driven",
      ).toBe(markBefore);
      host.touchUp(3, 900, 900);
      host.tick();

      // THE DIVIDER ANSWERS TO NOBODY. Nine columns do not halve, and column
      // 4 belongs to neither wheel rather than being shared between them.
      const onDivider = drive(4, [500, 900], [500, 100], 800);
      expect(
        onDivider.length,
        "wheels: A CONTACT THAT BEGINS ON THE DIVIDER SENDS NOTHING. Sharing " +
          "the middle column between the two wheels would make the boundary " +
          `a lie. Observed ${onDivider.length} messages`,
      ).toBe(0);
      host.touchUp(4, 500, 100);
      host.tick();

      // THE ORIGIN LOCK, READ FROM THE PITCH SIDE: a finger that starts on
      // pitch and is dragged the WHOLE WIDTH of the pad - across the divider
      // and over every column the mod wheel owns - keeps bending and never
      // touches the mod controller.
      //
      // THE BAR IS RE-READ HERE RATHER THAN COMPARED AGAINST `restingBar`,
      // because the mod drive above deliberately moved it. Comparing against a
      // stale capture would assert the wrong fact and would go red on a card
      // that is behaving correctly.
      const barBeforeCross = barHeight();
      expect(
        barBeforeCross,
        "wheels: the mod bar is open before the crossing drag, or the " +
          "assertion that it did not move is vacuous",
      ).toBeGreaterThan(0);
      const across = drive(5, [50, 500], [1000, 500], 950);
      expect(
        [...new Set(across.map((m) => m.cmd))],
        "wheels: A GESTURE THAT STARTED ON PITCH STAYS ON PITCH. It crossed " +
          "the divider and all four mod columns and sent " +
          JSON.stringify([...new Set(across.map((m) => m.cmd))]),
      ).toEqual([224]);
      expect(
        barHeight(),
        "wheels: the mod bar did not move under a gesture that was not its " +
          "own, even though the finger crossed its whole width",
      ).toBe(barBeforeCross);
      host.touchUp(5, 1000, 500);
      host.tick();
      settle();

      expect(
        host.hid,
        "wheels: not one HID send across the whole session",
      ).toEqual([]);
      expect(
        host.errors,
        `wheels: no handler raised across six drives - ${host.errors.join(" | ")}`,
      ).toEqual([]);

      report.push(
        `  mod up+down: ${modded.length} messages, controller ${g.cc}, ` +
          `${Math.min(...values)}..${Math.max(...values)}, ` +
          `${new Set(values).size} distinct`,
        `  lifted at ${restingValue} with ${restingBar} rows lit: ` +
          `${afterLift} messages afterwards, bar still ${barAfterLift}`,
        `  pitch driven: ${pitchOnly.length} messages, cmd 224 only, bar ` +
          `unmoved at ${restingBar}`,
        `  mod driven: ${modOnly.length} messages, cmd 176 only, marker ` +
          `unmoved at ${markBefore}`,
        `  began on the divider: ${onDivider.length} messages`,
        `  began on pitch, dragged the whole width: ${across.length} ` +
          "messages, cmd 224 only",
      );
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nWHEELS hold and independence, plan 11-15:\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);

  // -------------------------------------------------------------------------
  // RADAR POINTS (plan 11-14, the user's answer `new-entry`): SONAR's arming,
  // SONAR's pending-list release and SONAR's decay pair, with ONE geometric
  // change - the wave is a ring rolling out from the centre rather than an
  // angle sweeping round it - and the pitch map that change forces. The
  // assertions below are the ones that reddening proves something about:
  // the plan's own negative check ("arm two points and disarm one; a test
  // that only checks the armed one would pass on a card that cannot forget")
  // and the geometry, which an angular sweep would fail by timing.
  // -------------------------------------------------------------------------
  it("rolls RADAR POINTS' ping out ring by ring, and a point taken away falls silent on the next pass", async () => {
    const entry = entryById("radar-points");
    const report: string[] = [];
    const stepTicks = knobValueOf(entry, "sweep") / 10;
    const root = knobValueOf(entry, "root");
    const channel = knobValueOf(entry, "channel");
    expect(
      Number.isInteger(stepTicks),
      "radar-points: the default ping period is a whole number of ticks",
    ).toBe(true);

    // THE SCALE IS A NAMED SET OF ANY LENGTH, and the eight directions WALK
    // it, wrapping an octave: degree b%#t, plus 12 for every full pass. The
    // view.spec.ts word-table gate is what forbids an eight-entry table made
    // for eight directions; this test derives the pitch the walk produces.
    const scaleKnob = entry.knobs.find((knob) => knob.id === "scale");
    expect(scaleKnob, "radar-points: has a scale knob").toBeDefined();
    if (typeof scaleKnob === "undefined") return;
    const scale = scaleKnob.values[entry.defaults.scale ?? scaleKnob.default]
      .split(",")
      .map((s) => Number.parseInt(s, 10));
    const degree = (b: number): number =>
      scale[b % scale.length] + 12 * Math.floor(b / scale.length);

    // The geometry, read off the Lua rather than trusted from its header:
    // note-on 144 and note-off 128 both go through gms on the channel knob.
    const rendered = renderLua(entry);
    expect(
      rendered.timer.includes(`:gms(${channel},144,`),
      "radar-points: the Timer sends NOTE-ON, status 144, through gms",
    ).toBe(true);
    // Since change 17B the release is the Points output's Type's off, `@TYPE*3//2-88`: 128 at the
    // default Type, a note (the wire below still reads 128).
    expect(
      rendered.timer.includes(`:gms(${channel},144*3//2-88,`),
      "radar-points: the Timer sends NOTE-OFF, status 128, through gms",
    ).toBe(true);

    // The compass bucket of a cell, as the Setup computes it: the vendored
    // Pinwheel's angle expression, floored, offset by half a bucket so the
    // eight directions sit in the MIDDLE of their buckets, then eight buckets.
    // Ported here so the expected pitch is DERIVED and never pasted.
    const bucketOf = (cell: number): number => {
      const y = Math.floor(cell / 9) - 4;
      const x = (cell % 9) - 4;
      const a = Math.floor(Math.atan2(y, x) * 41) + 16;
      return Math.floor((((a % 256) + 256) % 256) / 32);
    };

    // Three points on three DIFFERENT rings in three DIFFERENT directions, so
    // ring order and pitch are both tellable apart on the wire.
    const POINTS = [41, 24, 4].map((cell) => ({
      cell,
      ring: ringOf(cell),
      pitch: root + degree(bucketOf(cell)),
    }));
    expect(
      new Set(POINTS.map((p) => p.ring)).size,
      "radar-points: the three probe points sit on three different rings",
    ).toBe(3);
    expect(
      new Set(POINTS.map((p) => p.pitch)).size,
      "radar-points: the three probe points carry three different pitches",
    ).toBe(3);
    // Ring 1 is the eight cells around the emitter, one per direction - the
    // property the half-bucket offset was added for. Asserted on the ported
    // arithmetic here and on the wire below.
    const ringOne: number[] = [];
    for (let cell = 0; cell < 81; cell += 1)
      if (ringOf(cell) === 1) ringOne.push(bucketOf(cell));
    expect(
      [...ringOne].sort((a, b) => a - b),
      "radar-points: ring 1 carries one cell per compass direction",
    ).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    const { host, sim } = await open(entry);
    try {
      type Ev = { tick: number; cmd: number; p1: number };
      let events: Ev[] = [];
      let seen = host.midi.length;
      let tick = 0;
      let ringOneLitAtFire = -1;
      let ringFourLitAtFire = -1;
      const litOnRing = (ring: number): number => {
        let n = 0;
        for (let cell = 0; cell < 81; cell += 1)
          if (ringOf(cell) === ring && sim.layer(hwOfCell(cell), 2).pha > 0)
            n += 1;
        return n;
      };
      const run = (n: number): void => {
        for (let i = 0; i < n; i += 1) {
          host.tick();
          tick += 1;
          while (seen < host.midi.length) {
            const m = host.midi[seen];
            seen += 1;
            events.push({ tick, cmd: m.cmd, p1: m.p1 });
            // THE LIGHT, sampled at the moment ring 1 fires: every ring-1
            // cell is lit on the wave layer and no ring-4 cell is. A wedge
            // would light one or two of the eight; a whole-pad pulse would
            // light ring 4 too.
            if (
              m.cmd === 144 &&
              m.p1 === POINTS[0].pitch &&
              ringOneLitAtFire < 0
            ) {
              ringOneLitAtFire = litOnRing(1);
              ringFourLitAtFire = litOnRing(4);
            }
          }
        }
      };
      // A PRESS AND A LIFT, which the preview delivers completely (touch.ts
      // never emits code 9). Each press at a different coordinate inside the
      // cell, so the host's change gate delivers every one.
      const press = (cell: number, offset: number): void => {
        const x = ledCentre(cell % 9, "x") + offset;
        const y = ledCentre(Math.floor(cell / 9), "y");
        host.touchDown(0, x, y);
        run(1);
        host.touchUp(0, x, y);
        run(1);
      };
      const armed = (cell: number): boolean =>
        sim.layer(hwOfCell(cell), 1).pha === 255;
      const onsOf = (pitch: number): Ev[] =>
        events.filter((e) => e.cmd === 144 && e.p1 === pitch);
      // Every note-on paired to the note-off that follows it, as gaps in
      // ticks; whatever is still open at the end AND DUE is returned too. A
      // note started inside the last step of the window is not yet due - its
      // release is the next fire - and reporting it as hung would redden a
      // card behaving correctly, from a window phase the test does not
      // control.
      const release = (): { gaps: number[]; open: number[] } => {
        const opened = new Map<number, number>();
        const gaps: number[] = [];
        for (const e of events) {
          if (e.cmd === 144) {
            opened.set(e.p1, e.tick);
            continue;
          }
          if (e.cmd !== 128) continue;
          const at = opened.get(e.p1);
          if (typeof at === "undefined") continue;
          gaps.push(e.tick - at);
          opened.delete(e.p1);
        }
        const open = [...opened.entries()]
          .filter(([, at]) => tick - at >= stepTicks)
          .map(([pitch]) => pitch);
        return { gaps, open };
      };
      // EXACTLY sixteen steps, whatever phase of the ping the window opens
      // at: an eight-step period fires exactly twice in any sixteen-step
      // span. A window one step wider held THREE fires of ring 1 on the first
      // run of this test, from a phase the arming presses happened to leave.
      const twoPings = 2 * 8 * stepTicks;

      // 1. ARM THREE POINTS and see them lit on the arming layer.
      for (const p of POINTS) press(p.cell, 0);
      for (const p of POINTS) {
        expect(
          armed(p.cell),
          `radar-points: a press did not arm cell ${p.cell}, so nothing ` +
            "below proves anything",
        ).toBe(true);
      }
      events = [];

      // 2. TWO PINGS WITH ALL THREE ARMED.
      run(twoPings);
      const first = POINTS.map((p) => onsOf(p.pitch));
      report.push(
        `  three points armed, ${twoPings} ticks: ` +
          POINTS.map(
            (p, i) =>
              `ring ${p.ring} pitch ${p.pitch} fired at ` +
              first[i].map((e) => e.tick).join(","),
          ).join("; "),
      );
      for (let i = 0; i < POINTS.length; i += 1) {
        expect(
          first[i].length,
          `radar-points: ring ${POINTS[i].ring}'s point fired ` +
            `${first[i].length} time(s) over two pings; two were expected`,
        ).toBe(2);
      }
      // THE RING ORDER, ON THE WIRE. Ring 2's point sounds exactly one step
      // after ring 1's and ring 4's exactly three steps after it. SONAR's
      // angular sweep would place these three by DIRECTION instead, at three
      // unrelated steps, so this is the assertion that says which card this
      // is.
      expect(
        first[1][0].tick - first[0][0].tick,
        "radar-points: A PING ROLLS OUT RING BY RING. Ring 2's point must " +
          `sound exactly one step (${stepTicks} ticks) after ring 1's. ` +
          `Observed ring 1 at ${first[0][0].tick}, ring 2 at ${first[1][0].tick}`,
      ).toBe(stepTicks);
      expect(
        first[2][0].tick - first[0][0].tick,
        "radar-points: A PING ROLLS OUT RING BY RING. Ring 4's point must " +
          `sound exactly three steps (${3 * stepTicks} ticks) after ring 1's. ` +
          `Observed ring 1 at ${first[0][0].tick}, ring 4 at ${first[2][0].tick}`,
      ).toBe(3 * stepTicks);
      // THE BOUNDARY. Eight steps to a ping: five rings and three steps in
      // which the ring has left the pad and the Timer matches nothing. A
      // `%5` that re-fired the centre straight after the edge is red here.
      expect(
        first[0][1].tick - first[0][0].tick,
        "radar-points: ONE PING IS EIGHT STEPS - five rings out and three of " +
          "quiet while the ring is past the edge. Ring 1's point must sound " +
          `every ${8 * stepTicks} ticks. Observed ${first[0][0].tick} then ` +
          `${first[0][1].tick}`,
      ).toBe(8 * stepTicks);
      // THE LIGHT, at the fire.
      expect(
        ringOneLitAtFire,
        "radar-points: when ring 1 fires, ALL EIGHT of its cells are lit on " +
          `the wave layer - it is a ring, not a wedge. Observed ${ringOneLitAtFire}`,
      ).toBe(8);
      expect(
        ringFourLitAtFire,
        "radar-points: when ring 1 fires, NO ring-4 cell is lit on the wave " +
          `layer - it is a ring, not a pulse of the whole pad. Observed ` +
          `${ringFourLitAtFire}`,
      ).toBe(0);
      // EVERY NOTE IS RELEASED ONE STEP LATER, SONAR's contract, reused.
      const a = release();
      expect(
        a.gaps.length,
        "radar-points: no release was paired to a note-on, so the gap " +
          "assertion proves nothing",
      ).toBeGreaterThan(0);
      expect(
        a.open,
        "radar-points: EVERY NOTE THE PING STARTS MUST BE RELEASED. Left " +
          "open at the end of two pings",
      ).toEqual([]);
      expect(
        [...new Set(a.gaps)],
        "radar-points: A NOTE IS EXACTLY ONE STEP LONG - the following fire " +
          `releases it. Observed gaps ${[...new Set(a.gaps)].join(", ")}`,
      ).toEqual([stepTicks]);

      // 3. TAKE ONE POINT AWAY - the middle ring - and run two more pings.
      //    This is the clause a happy-path test misses: a card that cannot
      //    forget keeps sounding it.
      press(POINTS[1].cell, 1);
      expect(
        armed(POINTS[1].cell),
        `radar-points: the second press did not disarm cell ${POINTS[1].cell}`,
      ).toBe(false);
      events = [];
      run(twoPings);
      const after = POINTS.map((p) => onsOf(p.pitch).length);
      report.push(
        `  ring ${POINTS[1].ring} removed, ${twoPings} ticks: fired ` +
          POINTS.map((p, i) => `ring ${p.ring} x${after[i]}`).join(", "),
      );
      expect(
        after[1],
        "radar-points: A POINT TAKEN AWAY FALLS SILENT ON THE NEXT PASS. " +
          `Ring ${POINTS[1].ring}'s point was disarmed and still sounded ` +
          `${after[1]} time(s) over two pings`,
      ).toBe(0);
      expect(
        [after[0], after[2]],
        "radar-points: the two points still armed keep sounding, twice each " +
          "over two pings, while the removed one is silent",
      ).toEqual([2, 2]);
      const b = release();
      expect(
        b.open,
        "radar-points: nothing is left open after the removal",
      ).toEqual([]);

      // 4. PUT IT BACK. "Add or remove" runs both ways.
      press(POINTS[1].cell, 2);
      expect(
        armed(POINTS[1].cell),
        `radar-points: the third press did not re-arm cell ${POINTS[1].cell}`,
      ).toBe(true);
      events = [];
      run(twoPings);
      const back = onsOf(POINTS[1].pitch).length;
      report.push(
        `  ring ${POINTS[1].ring} put back, ${twoPings} ticks: fired x${back}`,
      );
      expect(
        back,
        "radar-points: a point put back sounds again on the next pass",
      ).toBe(2);

      expect(
        host.hid,
        "radar-points: no HID call reached the host across the whole run",
      ).toEqual([]);
      expect(
        host.errors,
        `radar-points: no handler raised - ${host.errors.join(" | ")}`,
      ).toEqual([]);
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nRADAR POINTS, plan 11-14 (the ring is the time, the direction the pitch):\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);

  // -------------------------------------------------------------------------
  // THE TOUCH LIBRARY, IN A REAL LUA VM, THROUGH THE HOST'S `system` OPTION.
  //
  // These two drive `src/lib/catalog/library.ts` exactly as the module will run
  // it: the library goes in as the SYSTEM Setup and the probe below is the
  // touch Setup that calls it by name, which is the seam
  // `PROBE-RESULTS-2026-09-10.md` decided and 12-02 put on the wire. The probe
  // reports through MIDI because MIDI is the host's own ordered log: CC1
  // carries whatever `Q` returned, CC2 carries a release through the `R`
  // convention, and the absence of a CC1 IS the nil.
  //
  // Everything asserted here is measured in wasmoon. Nothing in this file is
  // hardware-verified; 12-12 hands the bench its rows.
  // -------------------------------------------------------------------------

  /** The touch Setup under test: every return and every release, as MIDI. */
  const LIBRARY_PROBE =
    "--[[@cb]]R=function(s,i)s:gms(1,176,2,i,0)end " +
    "self.touch_cb=function(s,i,e,x,y)local m=Q(s,i,e,x,y)" +
    "if m then s:gms(0,176,1,m,0)end end gtt(0,10)";

  /** The Timer that sweeps, with the caller's own window. */
  const LIBRARY_SWEEP = "--[[@cb]]gtt(0,10)X(self,20)";

  /** Cell returns, in call order. */
  const cellsOf = (midi: readonly HostMidi[]): number[] =>
    midi.filter((m) => m.p1 === 1).map((m) => m.p2);

  /** Contacts released through `R`, in call order. */
  const releasesOf = (midi: readonly HostMidi[]): number[] =>
    midi.filter((m) => m.p1 === 2).map((m) => m.p2);

  it("holds a finger on the line between two cells, and toggles once per cell crossed", async () => {
    // PROBE RULE 1, ON THE PROBE'S OWN NUMBERS (Q2). The user's trace was
    // 71, 72, 71, 71, 71 from a finger that was not moving, and `71*9//128 = 4`
    // while `72*9//128 = 5` - so the naive read flips the cell on a one-unit
    // wobble. That is what EUCLID (ORBIT now), STEPS and RADAR POINTS reported as "not
    // precise", and this is the test that says it cannot happen again.
    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup: LIBRARY_PROBE,
    });
    const report: string[] = [];
    try {
      const move = (x: number, y: number): void => {
        host.touchMove(0, x, y);
        host.tick();
      };

      // 1. The research's nine samples, on a finger drifting across one
      //    boundary. The naive reading toggles three times before it settles;
      //    the hysteresis reading changes ONCE.
      host.touchDown(0, 14, 3);
      host.tick();
      const drift = [15, 14, 15, 16, 15, 20, 24, 26, 30];
      // THE EXPECTATION IS THE LIBRARY'S OWN RULE ON THE MEASURED MAP (12.1):
      // `W` holds the LED while the calibrated coordinate is within the hold
      // margin of its centre, else takes the nearest; computed from
      // calibration.ts, never typed. The 12-07 sequence 0,0,0,0,0,0,1,1,1,1
      // was the naive map's, where these samples straddled the 0/1 seam at
      // 14.2; on the measured knots x = 14 is inside LED 1 and the drift
      // crosses the 1/2 seam instead. The claim is the same: one crossing.
      const row = nearestLed(calibratedAxis(3, "y"));
      let twin = nearestLed(calibratedAxis(14, "x"));
      const predicted: number[] = [twin + row * 9];
      for (const x of drift) {
        twin = holdOrNearest(calibratedAxis(x, "x"), twin);
        predicted.push(twin + row * 9);
      }
      const held: number[] = [cellsOf(host.midi).at(-1)!];
      const naive: number[] = [Math.floor((14 * 9) / 128)];
      for (const x of drift) {
        const before = host.midi.length;
        move(x, 3);
        const changed = cellsOf(host.midi).at(-1);
        held.push(host.midi.length > before ? changed! : held[held.length - 1]);
        naive.push(Math.floor((x * 9) / 128));
      }
      report.push(`  drift x: ${[14, ...drift].join(", ")}`);
      report.push(`  naive:   ${naive.join(", ")}`);
      report.push(`  library: ${held.join(", ")}`);
      report.push(`  twin:    ${predicted.join(", ")}`);
      expect(
        held,
        "the VM does not read the drift as the library's own rule on the " +
          "measured map predicts",
      ).toEqual(predicted);
      let naiveToggles = 0;
      for (let k = 1; k < naive.length; k += 1) {
        if (naive[k] !== naive[k - 1]) naiveToggles += 1;
      }
      let heldToggles = 0;
      for (let k = 1; k < held.length; k += 1) {
        if (held[k] !== held[k - 1]) heldToggles += 1;
      }
      let predictedToggles = 0;
      for (let k = 1; k < predicted.length; k += 1) {
        if (predicted[k] !== predicted[k - 1]) predictedToggles += 1;
      }
      expect(
        [naiveToggles, heldToggles],
        "the hysteresis has to remove crossings, not merely move them: the " +
          "naive read of these samples toggles four times, the library once",
      ).toEqual([4, predictedToggles]);
      expect(heldToggles, "one clean crossing").toBe(1);

      // 2. THE PROBE'S OWN 71/72 BOUNDARY, and the seven-value band.
      const second = new PadSim(blankPadState());
      const edge = await createLuaHost({
        sim: second,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup: LIBRARY_PROBE,
      });
      try {
        const walk = [72, 71, 72, 73, 74, 75, 74, 68, 67];
        edge.touchDown(0, 71, 64);
        edge.tick();
        // The prediction, from the table: on the measured knots the probe's
        // whole trace sits INSIDE LED 4's hold band (the up-switch is past
        // 75 and the down-switch below 68 - printed as the band below), so
        // the library reads every sample as column 4. The 12-07 sequence
        // 4,4,4,4,4,4,5,5,5,4 was the naive map's, whose seam sat at 71.1.
        const edgeRow = nearestLed(calibratedAxis(64, "y"));
        let edgeTwin = nearestLed(calibratedAxis(71, "x"));
        const predictedEdge: number[] = [edgeTwin];
        for (const x of walk) {
          edgeTwin = holdOrNearest(calibratedAxis(x, "x"), edgeTwin);
          predictedEdge.push(edgeTwin);
        }
        const cells: number[] = [cellsOf(edge.midi).at(-1)!];
        expect(cells[0], "the press lands on row 4").toBe(
          edgeTwin + edgeRow * 9,
        );
        for (const x of walk) {
          const before = edge.midi.length;
          edge.touchMove(0, x, 64);
          edge.tick();
          const changed = cellsOf(edge.midi).at(-1);
          cells.push(
            edge.midi.length > before ? changed! : cells[cells.length - 1],
          );
        }
        const columns = cells.map((cell) => cell % 9);
        report.push(`  edge x:  ${[71, ...walk].join(", ")}`);
        report.push(`  column:  ${columns.join(", ")}`);
        report.push(`  twin:    ${predictedEdge.join(", ")}`);
        expect(
          columns,
          "the probe's own trace is not read as the library's rule on the " +
            "measured map predicts",
        ).toEqual(predictedEdge);
        expect(
          new Set(columns).size,
          "a finger on the probe's 71/72 line is read as ONE column",
        ).toBe(1);

        // THE BAND, FROM THE TABLE (12.1-CONTEXT D-18): the raw x values
        // held from LED 4 AND held from LED 5, i.e. within the hold margin
        // of both centres in calibrated units. It is a fraction of the LOCAL
        // pitch, so its width in raw units is the segment's, not a constant;
        // "the gradient (12.1)" below asserts the switch points per segment.
        const band: number[] = [];
        for (let x = KX[4]; x <= KX[5]; x += 1) {
          const u = calibratedAxis(x, "x");
          if (holdOrNearest(u, 4) === 4 && holdOrNearest(u, 5) === 5)
            band.push(x);
        }
        report.push(
          `  overlap: ${band.join(", ")} (${band.length} values, pitch ` +
            `${KX[5] - KX[4]})`,
        );
        for (const x of [71, ...walk]) {
          expect(
            holdOrNearest(calibratedAxis(x, "x"), 4),
            `the probe's sample ${x} is not held from LED 4 on the measured ` +
              "map, so the one-column reading above was not the hysteresis",
          ).toBe(4);
        }
        expect(
          band.length,
          "the overlap band between LED 4 and 5 is empty on the measured map",
        ).toBeGreaterThan(0);
        expect(edge.errors, edge.errors.join(" | ")).toEqual([]);
      } finally {
        edge.close();
      }

      // 3. `A`, THE USER'S OWN SNIPPET: one axis per moved axis, and a DOWN
      //    primes without sending. Its single caller is LUMEN (12-11).
      const third = new PadSim(blankPadState());
      const axes = await createLuaHost({
        sim: third,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup:
          "--[[@cb]]self.touch_cb=function(s,i,e,x,y)A(s,i,e,x,y,16,17,0)end",
      });
      try {
        axes.touchDown(0, 10, 10);
        axes.tick();
        expect(axes.midi, "a DOWN primes the memory and sends nothing").toEqual(
          [],
        );
        axes.touchMove(0, 11, 10);
        axes.tick();
        axes.touchMove(0, 11, 12);
        axes.tick();
        const sent = axes.midi.map((m) => [m.p1, m.p2]);
        report.push(`  per-axis: ${JSON.stringify(sent)}`);
        expect(
          sent,
          "x moved alone, then y moved alone, and 127-12 = 115 is the " +
            "snippet's own inversion and not a bug",
        ).toEqual([
          [16, 11],
          [17, 115],
        ]);
        expect(axes.errors, axes.errors.join(" | ")).toEqual([]);
      } finally {
        axes.close();
      }

      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nTHE TOUCH LIBRARY, hysteresis and per-axis sends (plan 12-07):\n" +
        report.join("\n") +
        "\n",
    );
  }, 60000);

  it("never trusts a lift, on the same id or another: three presses release and a quiet contact releases", async () => {
    // PROBE RULE 2 (Q6.5, Q7). Four of five contacts never sent their code 5
    // after a five-finger chord, and an entry that sends note-on at press and
    // note-off at release hangs a note exactly that way. All four expiry paths
    // are driven here, and THE SAME-ID CASE GOES FIRST because it is the case
    // the hardware normally takes: firmware assigns the lowest free contact id,
    // so after a lost lift the next press is usually the same id.
    const report: string[] = [];
    const open = async (timer?: string) => {
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup: LIBRARY_PROBE,
        timer,
      });
      return { sim, host };
    };

    // 1. SAME ID, SAME CELL, NO LIFT. This is the one the superseded sketch
    //    got wrong: it expired OTHER contacts on an onset and never contact `i`
    //    itself, so the hysteresis read the new press against the stale cell,
    //    `n == h` fired, and Q RETURNED NIL - the press vanished and the cell
    //    stayed dead until the finger moved elsewhere.
    {
      const { host } = await open();
      try {
        host.touchDown(0, 64, 64); // cell 40
        host.tick();
        host.touchMove(0, 65, 64); // inside the same cell: nil, no message
        host.tick();
        host.touchDown(0, 65, 64); // the lift never came; press again
        host.tick();
        report.push(
          `  same id, same cell: returns ${JSON.stringify(cellsOf(host.midi))}, ` +
            `releases ${JSON.stringify(releasesOf(host.midi))}`,
        );
        expect(
          cellsOf(host.midi),
          "THE RE-PRESS MUST RETURN ITS CELL. A release without a return is " +
            "the defect this closes: the press was swallowed, not the release",
        ).toEqual([40, 40]);
        // `R` fires on EVERY onset, the first press included, because Q expires
        // contact `i` unconditionally rather than paying nine characters to ask
        // whether it held anything. An entry's `R` must therefore be
        // idempotent, and `library.ts` section 3 says so where CHORUS will read
        // it.
        expect(
          releasesOf(host.midi),
          "every onset releases contact 0 through R",
        ).toEqual([0, 0]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // 2. SAME ID, A DIFFERENT CELL.
    {
      const { host } = await open();
      try {
        host.touchDown(0, 64, 64); // cell 40
        host.tick();
        host.touchDown(0, 78, 64); // cell 41, no lift in between
        host.tick();
        report.push(
          `  same id, new cell:  returns ${JSON.stringify(cellsOf(host.midi))}, ` +
            `releases ${JSON.stringify(releasesOf(host.midi))}`,
        );
        expect(
          cellsOf(host.midi),
          "the second press returns its own cell",
        ).toEqual([40, 41]);
        expect(releasesOf(host.midi), "contact 0 was released twice").toEqual([
          0, 0,
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // 3. CROSS CONTACT: a press on a cell another contact still holds means
    //    that holder is a ghost too.
    {
      const { host } = await open();
      try {
        host.touchDown(0, 64, 64);
        host.tick();
        host.touchDown(1, 64, 64);
        host.tick();
        report.push(
          `  cross contact:      returns ${JSON.stringify(cellsOf(host.midi))}, ` +
            `releases ${JSON.stringify(releasesOf(host.midi))}`,
        );
        expect(
          cellsOf(host.midi),
          "contact 1 gets the cell contact 0 was squatting on",
        ).toEqual([40, 40]);
        expect(
          releasesOf(host.midi),
          "contact 1's own onset expiry first, then the stale contact 0 the " +
            "cross-contact scan found on that cell",
        ).toEqual([0, 1, 0]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // 4. THE TIMER SWEEP, with the CALLER's window - `X(self,20)`, which is
    //    CHORUS's 20-call watchdog at 100 ms. The library holds no window of
    //    its own; see library.ts section 5 and the bench row 12-12 asks for.
    {
      const { host } = await open(LIBRARY_SWEEP);
      try {
        host.touchDown(0, 64, 64);
        host.tick();
        const afterPress = host.midi.length;
        host.run(19);
        expect(
          host.midi.length,
          "a contact inside the window is not swept",
        ).toBe(afterPress);
        host.tick();
        report.push(
          `  timer sweep:        releases ${JSON.stringify(releasesOf(host.midi))} ` +
            "after 21 X(s,20) calls",
        );
        expect(
          releasesOf(host.midi),
          "the quiet contact is released through R once the window passes",
        ).toEqual([0, 0]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // 4b. AND A CONTACT THAT KEEPS REPORTING IS NOT RELEASED. Q stamps `T[i]=C`
    //     on every live sample, including the ones whose cell did not change,
    //     so a finger wobbling inside one cell stays alive. Without this half
    //     the sweep would be a two-second kill switch on every held chord.
    {
      const { host } = await open(LIBRARY_SWEEP);
      try {
        host.touchDown(0, 64, 64);
        host.tick();
        for (let t = 0; t < 40; t += 1) {
          // The input has to VARY: the host change-gates the FIFO per contact
          // on (event, x, y), so a repeated identical MOVE would be dropped
          // before it reached the VM and this probe would be measuring the
          // gate rather than the library.
          host.touchMove(0, 64 + (t % 2), 64);
          host.tick();
        }
        report.push(
          `  still reporting:    releases ${JSON.stringify(releasesOf(host.midi))} ` +
            "over 40 sweeps",
        );
        expect(
          releasesOf(host.midi),
          "a contact that keeps reporting is released once, by its own onset, " +
            "and never by the sweep",
        ).toEqual([0]);
        expect(cellsOf(host.midi), "the wobble never changes cell").toEqual([
          40,
        ]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // 5. `D` LANDS ON PHASE 0. The class-A rule, parameterised: rate 250 is -6
    //    on the byte ring, so w = 252 walks down in 42 ticks and freezes dark.
    {
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup: "--[[@cb]]D(40,2,252)",
      });
      try {
        const at = hwOfCell(40);
        expect(
          [
            sim.layer(at, 2).pha,
            sim.layer(at, 2).fre,
            sim.layer(at, 2).timeout,
          ],
          "D wrote the decay the idiom describes",
        ).toEqual([252, 250, 42]);
        const walk: number[] = [];
        for (let t = 0; t < 42; t += 1) {
          host.tick();
          walk.push(sim.layer(at, 2).pha);
        }
        report.push(
          `  D(40,2,252):        ${walk[0]} -> ${walk[40]} -> ${walk[41]} in 42 ticks`,
        );
        expect(
          walk[41],
          "D freezes above 0, so the cell stays lit forever",
        ).toBe(0);
        expect(
          sim.layer(at, 2).fre,
          "the countdown did not stop the walk",
        ).toBe(0);
        host.run(20);
        expect(
          sim.layer(at, 2).pha,
          "the frozen layer walked on past its landing",
        ).toBe(0);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nTHE TOUCH LIBRARY, four expiry paths and the decay (plan 12-07):\n" +
        report.join("\n") +
        "\n",
    );
  }, 60000);

  // -------------------------------------------------------------------------
  // THE BOUNDARY FINGER, ON THE FOUR SEQUENCERS THAT NOW CALL `Q` (plan 12-08)
  //
  // This is the user's own complaint, in a VM. "EUCLID: still not precise",
  // "STEPS: same as the other sequencers", "RADAR POINTS: nice but needs the
  // touch detection framework" - and PROBE-RESULTS-2026-09-10.md Q2 is what all
  // three are. A MOTIONLESS finger on the line between two cells sent
  // 71, 72, 71, 71, 71, and `71*9//128 = 4` while `72*9//128 = 5`, so a
  // one-unit wobble flipped the cell and the entries toggled BOTH of them.
  //
  // SONAR IS THE FOURTH SUBJECT AND NO BENCH NOTE NAMED IT. It carried the same
  // inlined guard byte for byte, and it TOGGLES - so an EVEN number of boundary
  // crossings leaves the cell exactly as it was while an arm count still looks
  // right. That is why the assertions below are on the NET STATE as well as on
  // the count: plan 11-08's wave found an unguarded swipe toggling each cell an
  // even number of times, and the naive fix looked exactly like the bug.
  //
  // THE OBSERVABLE IS THE ARM LAYER'S PHASE, as in 11-08's swipe test: each of
  // the four paints its armed state on a layer its own Timer never writes, so
  // the phase of that layer is exactly "is this cell armed", independent of the
  // tick the gesture happens to land on.
  // -------------------------------------------------------------------------

  /**
   * The four entries, and the layer each one paints ARMED state on.
   *
   * RADAR POINTS is not in `SWIPE_ENTRIES` - it was authored after 11-08 - so
   * this table is its own rather than an extension of that one, and it carries
   * the fourth subject the swipe test does not have.
   */
  const BOUNDARY_ENTRIES: readonly {
    readonly id: string;
    readonly armLayer: 0 | 1 | 2;
    readonly why: string;
  }[] = [
    {
      id: "orbit",
      armLayer: 1,
      why: "the ring markers are layer 1; the running head and its trail are layer 2",
    },
    {
      id: "steps",
      armLayer: 2,
      why: "armed cells are layer 2; the sweeping column is layer 1",
    },
    {
      id: "radar-points",
      armLayer: 1,
      why: "placed points are layer 1; the ping is layer 2 and the emitter is layer 0",
    },
    {
      id: "sonar",
      armLayer: 1,
      why: "armed cells are layer 1; the sweep is layer 2 and the hub is layer 0",
    },
  ];

  /** The probe's own trace, as raw x: a finger that is not moving. */
  const BOUNDARY_WOBBLE: readonly number[] = [72, 71, 72, 71, 73, 72];
  /** The raw coordinates the gesture starts at - the probe's own line. */
  const BOUNDARY_X = 71;
  const BOUNDARY_Y = 80;
  /**
   * The two coordinates it then crosses to, DERIVED FROM THE MEASURED MAP
   * (12.1): the first raw x at which `W` lets go of LED 4 walking right, and
   * the first at which it lets go of LED 5 walking left. They were 76 and 66
   * under the naive map's +-10 window; on the measured knots the pitch
   * between LED 4 and 5 is wider and so is the band.
   */
  const ACROSS_X = switchUp(4, "x");
  const BACK_X = switchDown(4, "x");

  /** The naive read of one axis - what every one of the four used to compute. */
  const naiveAxis = (v: number): number => Math.floor((v * 9) / 128);

  it("holds a boundary finger on one cell on ORBIT, STEPS, RADAR POINTS and SONAR, counted", async () => {
    // THE GESTURE IS A REAL BOUNDARY WOBBLE AND NOT A STILL FINGER, and that is
    // asserted before anything is measured through an entry. The naive column
    // for 71, 72, 71, 72, 71, 73, 72 is 4, 5, 4, 5, 4, 5, 5 - FIVE crossings
    // out of six samples - so an entry that reads the axis naively has five
    // chances to toggle and one that holds the cell has none.
    const naiveWalk = [BOUNDARY_X, ...BOUNDARY_WOBBLE].map(naiveAxis);
    let naiveCrossings = 0;
    for (let k = 1; k < naiveWalk.length; k += 1) {
      if (naiveWalk[k] !== naiveWalk[k - 1]) naiveCrossings += 1;
    }
    expect(
      [naiveWalk, naiveCrossings],
      "the probe's trace crosses the 71/72 line five times under a naive read",
    ).toEqual([[4, 5, 4, 5, 4, 5, 5], 5]);

    // THE TWO CELLS, DERIVED FROM THE LIBRARY'S OWN MAP (12.1): the four
    // entries read their cell through `Q`, so the held cell is the nearest
    // calibrated cell of the start point and the neighbour the one the
    // crossing reaches - the next column of the same row.
    const held = calibratedCell(BOUNDARY_X, BOUNDARY_Y);
    const neighbour = calibratedCell(ACROSS_X, BOUNDARY_Y);
    expect(
      [held % 9, neighbour],
      "the finger rests on LED 4 of its row and the crossing reaches LED 5 " +
        "of the same row - derived from the map, never pasted",
    ).toEqual([4, held + 1]);
    expect(
      BACK_X < BOUNDARY_X && BOUNDARY_X < ACROSS_X,
      "the probe's line sits inside the hold band between the two switches",
    ).toBe(true);

    const report: string[] = [];
    const finalState = new Map<string, [number, number]>();

    for (const row of BOUNDARY_ENTRIES) {
      const entry = entryById(row.id);
      const { host, sim } = await open(entry);
      try {
        const at = (cell: number): number =>
          sim.layer(hwOfCell(cell), row.armLayer).pha;

        const restHeld = at(held);
        const restNeighbour = at(neighbour);
        let lastHeld = restHeld;
        let lastNeighbour = restNeighbour;
        let heldChanges = 0;
        let neighbourChanges = 0;
        const sample = (): void => {
          const h = at(held);
          const n = at(neighbour);
          if (h !== lastHeld) heldChanges += 1;
          if (n !== lastNeighbour) neighbourChanges += 1;
          lastHeld = h;
          lastNeighbour = n;
        };

        // 1. THE REST. A DOWN on the line, then the probe's six wobbling MOVEs.
        //    Every sample is a DISTINCT coordinate, so the host's change gate
        //    (which dedups the FIFO per contact on event, x and y) delivers all
        //    of them and this probe measures the entry rather than the gate.
        host.touchDown(0, BOUNDARY_X, BOUNDARY_Y);
        host.tick();
        sample();
        for (const x of BOUNDARY_WOBBLE) {
          host.touchMove(0, x, BOUNDARY_Y);
          host.tick();
          sample();
        }
        const wobbleHeld = heldChanges;
        const wobbleNeighbour = neighbourChanges;
        const afterWobble = lastHeld;

        // 2. ACROSS THE LINE FOR REAL. ACROSS_X is the first raw x whose
        //    calibrated coordinate is the hold margin past LED 4's centre, so
        //    the hysteresis releases and the neighbour takes one toggle.
        host.touchMove(0, ACROSS_X, BOUNDARY_Y);
        host.tick();
        sample();
        const acrossHeld = heldChanges - wobbleHeld;
        const acrossNeighbour = neighbourChanges - wobbleNeighbour;

        // 3. AND BACK. BACK_X is the first raw x whose calibrated coordinate is
        //    the hold margin short of LED 5's centre, so the held cell takes
        //    one toggle back.
        host.touchMove(0, BACK_X, BOUNDARY_Y);
        host.tick();
        sample();
        const backHeld = heldChanges - wobbleHeld - acrossHeld;
        const backNeighbour =
          neighbourChanges - wobbleNeighbour - acrossNeighbour;

        host.touchUp(0, BACK_X, BOUNDARY_Y);
        host.tick();
        sample();

        report.push(
          `  ${row.id}: rest [${restHeld}, ${restNeighbour}] -> wobble ` +
            `${wobbleHeld}/${wobbleNeighbour} -> across ${acrossHeld}/` +
            `${acrossNeighbour} -> back ${backHeld}/${backNeighbour}; ` +
            `cell ${held} after the wobble ${afterWobble} (${row.why})`,
        );

        // ONE ARM ACROSS THE WHOLE REST, AND NOTHING ON THE NEIGHBOUR. The
        // naive column above crosses five times; every one of those crossings
        // used to be a toggle on one of these two cells.
        expect(
          [wobbleHeld, wobbleNeighbour],
          `${row.id}: A FINGER RESTING ON THE LINE BETWEEN TWO CELLS MUST ARM ` +
            "ONE OF THEM AND HOLD IT. Before plan 12-08 the one-unit wobble " +
            "the probe recorded was read as alternating taps on two cells, " +
            "which is what the bench reported as 'not precise'. Observed " +
            `${wobbleHeld} change(s) on cell ${held} and ${wobbleNeighbour} ` +
            `on cell ${neighbour}, over ${BOUNDARY_WOBBLE.length} MOVEs`,
        ).toEqual([1, 0]);

        // THE NET STATE, NOT ONLY THE COUNT. All four TOGGLE, so an even
        // number of crossings leaves the cell exactly as it was and a
        // count-only assertion would pass on the defect. This is the assertion
        // that makes the count mean something.
        expect(
          afterWobble,
          `${row.id}: the rested cell must end the wobble in the OPPOSITE ` +
            "state to the one it started in - one toggle, net. An even " +
            "number of boundary crossings returns it to rest while an arm " +
            `count still looks right. Observed ${restHeld} -> ${afterWobble}`,
        ).not.toBe(restHeld);

        expect(
          [acrossHeld, acrossNeighbour, backHeld, backNeighbour],
          `${row.id}: crossing the line for real must move the arm ONCE each ` +
            "way - the hysteresis is a held cell, not a dead zone. Observed " +
            `across ${acrossHeld}/${acrossNeighbour}, back ` +
            `${backHeld}/${backNeighbour}`,
        ).toEqual([0, 1, 1, 0]);

        expect(
          host.errors,
          `${row.id}: no handler raised - ${host.errors.join(" | ")}`,
        ).toEqual([]);
        finalState.set(row.id, [restHeld, afterWobble]);
      } finally {
        host.close();
      }
    }

    // SONAR'S FINAL STATE, LITERALLY. Its Setup writes glp(c,1,0) for all 81
    // cells, so a cell at rest is phase 0 and an armed one is 255. The plan
    // names SONAR because it is the entry no bench note asked for; the same
    // pair holds for RADAR POINTS, whose callback SONAR's is reused by, and
    // for STEPS, whose cell 44 is not one of its default-armed ones.
    expect(
      finalState.get("sonar"),
      "SONAR'S CELL MUST BE ARMED WHEN THE FINGER LEAVES THE LINE, not merely " +
        "toggled an odd number of times somewhere. It is dark at rest and it " +
        "toggles, so 0 -> 255 is the whole claim",
    ).toEqual([0, 255]);
    expect(
      [finalState.get("radar-points"), finalState.get("steps")],
      "the other two dark-at-this-cell entries read the same way",
    ).toEqual([
      [0, 255],
      [0, 255],
    ]);

    // ---------------------------------------------------------------------
    // THE SWEEP IS WIRED, NOT MERELY PRESENT.
    //
    // SONAR carries this half, and the reason is arithmetic: its @PERIOD
    // default is 70 ms against RADAR POINTS' 140, ORBIT's 110 and STEPS's
    // 120, so 21 Timer calls are 147 ticks here and up to 294 elsewhere - the
    // same proof at half the run. A DOWN with no UP is Q6.5 exactly: four of
    // five contacts never sent their code 5 after a five-finger chord, and
    // `Q`'s own expiry rules cannot reach a contact that never presses again.
    // The observable is the LIBRARY's `H`, read through the host's global
    // table, because a stale cell held for a session is invisible in the
    // picture until the next press is measured against it.
    // ---------------------------------------------------------------------
    {
      const entry = entryById("sonar");
      const { host } = await open(entry);
      try {
        host.touchDown(0, BOUNDARY_X, BOUNDARY_Y);
        host.tick();
        host.touchMove(0, BOUNDARY_X + 1, BOUNDARY_Y);
        host.tick();
        const holding = host.globalSize("H");

        // NINE TIMER CALLS AT 70 ms IS 63 TICKS, and the window is twenty, so
        // nothing may be released yet. Without this half the assertion below
        // would pass on a sweep with no window at all.
        host.run(63);
        const inside = host.globalSize("H");

        // Twenty-one more calls: 147 ticks, plus the two the gesture spent.
        host.run(160);
        const after = host.globalSize("H");
        const stamps = host.globalSize("T");

        report.push(
          `  sonar sweep: H ${holding} after the press, ${inside} after 9 ` +
            `Timer calls, ${after} after 30 (T ${stamps})`,
        );
        expect(
          [holding, inside, after, stamps],
          "A CONTACT WHOSE LIFT WAS LOST IS RELEASED BY THE TIMER SWEEP AND " +
            "BY NOTHING ELSE. Q's onset rules need a PRESS - the same id " +
            "pressing again, or another contact landing on the held cell - so " +
            "a contact that goes quiet and never presses again holds its cell " +
            "for the rest of the session and every future press by that id is " +
            "measured against it. X(s,20) in the Timer is the only path that " +
            `reaches it. Observed H ${holding} -> ${inside} -> ${after}`,
        ).toEqual([1, 1, 0, 0]);
        expect(
          host.errors,
          `sonar: no handler raised - ${host.errors.join(" | ")}`,
        ).toEqual([]);
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nTHE BOUNDARY FINGER, on the four sequencers (plan 12-08):\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);

  // -------------------------------------------------------------------------
  // CHORUS SOUNDS ONE CHORD AT A TIME (plan 12-09)
  //
  // THE BENCH NOTE, VERBATIM: "CHORUS: egyszerre csak egy akkordot tudjon
  // kuldeni, exkluzivak legyenek a padok" - one chord at a time, the pads
  // exclusive. It used to hold a chord PER CONTACT, so two fingers sounded six
  // notes and five sounded fifteen.
  //
  // THIS IS THE LIBRARY'S ONE `R` CALLER, and the test drives all three of the
  // paths `E` reaches it on that matter to a note: a second finger on another
  // pad, a lift, and - the one no other entry in this phase can show - a
  // contact that goes QUIET and is released by the Timer's sweep. That is
  // PROBE-RESULTS-2026-09-10.md Q6.5 with a note attached to it: four of five
  // contacts never sent their code 5 after a five-finger chord, and a card that
  // sends note-on at press and note-off at release hangs a chord exactly that
  // way.
  //
  // THE SOUNDING COUNT IS TRACKED AFTER EVERY MESSAGE, not after every step,
  // because the claim is about an overlap that would exist for three messages
  // in the middle of one sample if the release came after the note-ons rather
  // than before them.
  // -------------------------------------------------------------------------

  /** The pad a screen cell belongs to, in the entry's own arithmetic. */
  const padOfCell = (cell: number): number =>
    Math.floor((cell % 9) / 3) + Math.floor(Math.floor(cell / 9) / 3) * 3;

  it("sounds ONE CHORUS chord at a time, and releases a chord whose finger went quiet", async () => {
    const entry = entryById("chorus");
    const key = knobValueOf(entry, "key");
    const velocity = knobValueOf(entry, "velocity");
    const scaleKnob = entry.knobs.find((knob) => knob.id === "scale");
    if (typeof scaleKnob === "undefined")
      throw new Error("chorus has no scale");
    const scale = scaleKnob.values[
      entry.defaults[scaleKnob.id] ?? scaleKnob.default
    ]
      .split(",")
      .map(Number);
    /** The triad the entry bakes for pad z: degrees z, z+2 and z+4. */
    const triadOf = (z: number): number[] =>
      [0, 1, 2].map((j) => {
        const d = z + j * 2;
        return key + scale[d % 7] + Math.floor(d / 7) * 12;
      });
    /** The centre of pad z, in raw coordinates - the entry's own u, v. */
    const aimAtPad = (z: number): [number, number] => [
      cellCentre((z % 3) * 3 + 1),
      cellCentre(Math.floor(z / 3) * 3 + 1),
    ];

    const PAD_A = 4;
    const PAD_B = 5;
    const [xa, ya] = aimAtPad(PAD_A);
    const [xb, yb] = aimAtPad(PAD_B);
    // DERIVED, NOT PASTED: the two aiming points really are in the two pads,
    // and they are different pads, or every assertion below is about one pad.
    expect(
      [
        padOfCell(Math.floor((xa * 9) / 128) + Math.floor((ya * 9) / 128) * 9),
        padOfCell(Math.floor((xb * 9) / 128) + Math.floor((yb * 9) / 128) * 9),
      ],
      "the two probe points must be the centres of pads 4 and 5",
    ).toEqual([PAD_A, PAD_B]);

    const report: string[] = [];

    /** A voice tracker that reads the peak after every single message. */
    const tracker = (host: { midi: readonly HostMidi[] }) => {
      const sounding = new Set<number>();
      let seen = 0;
      let peak = 0;
      return {
        get sounding() {
          return [...sounding].sort((a, b) => a - b);
        },
        get peak() {
          return peak;
        },
        /** Everything since the last drain, as `cmd:pitch` strings. */
        drain(): string[] {
          const fresh = host.midi.slice(seen);
          seen = host.midi.length;
          const out: string[] = [];
          for (const m of fresh) {
            out.push(`${m.cmd}:${m.p1}`);
            if (m.cmd === 144) {
              sounding.add(m.p1);
              peak = Math.max(peak, sounding.size);
            } else if (m.cmd === 128) sounding.delete(m.p1);
          }
          return out;
        },
      };
    };

    // -----------------------------------------------------------------------
    // 1. THE EXCLUSIVE PADS: a press, a second finger, and a lift that is not
    //    the owner's.
    // -----------------------------------------------------------------------
    {
      const { host } = await open(entry);
      const voices = tracker(host);
      try {
        // 1a. FINGER 0 ON PAD 4. Three note-ons and NOTHING ELSE, and the
        //     "nothing else" is the idempotence of `R`: 12-07 measured that `Q`
        //     expires contact `i` on EVERY onset without asking whether it held
        //     anything, so `R` is called on a contact's FIRST press. An `R`
        //     that sent an unconditional note-off would put three note-offs in
        //     front of these three note-ons, for a chord that was never on.
        host.touchDown(0, xa, ya);
        host.tick();
        const first = voices.drain();
        report.push(
          `  finger 0 on pad ${PAD_A}: ${first.join(" ")} - sounding ` +
            `${voices.sounding.join(",")}`,
        );
        expect(
          first,
          "chorus: A FIRST PRESS MUST SEND THREE NOTE-ONS AND NOTHING ELSE. " +
            "`Q` expires contact 0 before it computes the cell, so `R` runs on " +
            "this press too; an `R` that did not ask whether it holds anything " +
            `would emit a note-off for a chord that never sounded. Observed ${first.join(" ")}`,
        ).toEqual(triadOf(PAD_A).map((n) => `144:${n}`));
        expect(voices.sounding, "pad 4's triad is sounding").toEqual(
          [...triadOf(PAD_A)].sort((a, b) => a - b),
        );
        expect(
          host.midi.every((m) => m.p2 === velocity || m.cmd === 128),
          "chorus: the note-ons carry the velocity knob's value",
        ).toBe(true);

        // 1b. FINGER 1 ON PAD 5, WITH FINGER 0 STILL DOWN. Three note-offs for
        //     pad 4 THEN three note-ons for pad 5, IN THAT ORDER.
        host.touchDown(1, xb, yb);
        host.tick();
        const second = voices.drain();
        report.push(
          `  finger 1 on pad ${PAD_B}, finger 0 still down: ` +
            `${second.join(" ")} - sounding ${voices.sounding.join(",")}`,
        );
        expect(
          second,
          "chorus: ONE CHORD AT A TIME, THE PADS EXCLUSIVE. A second finger on " +
            "another pad must release the sounding chord and then start the " +
            "new one, in that order - six messages, three off then three on. " +
            "Per contact, which is what this card used to do, it is six notes " +
            `sounding at once. Observed ${second.join(" ")}`,
        ).toEqual([
          ...triadOf(PAD_A).map((n) => `128:${n}`),
          ...triadOf(PAD_B).map((n) => `144:${n}`),
        ]);
        expect(voices.sounding, "only pad 5's triad is left").toEqual(
          [...triadOf(PAD_B)].sort((a, b) => a - b),
        );

        // 1c. FINGER 0 LIFTS, AND IT IS NOT THE OWNER. `Q` expires contact 0,
        //     `E` calls `R(s,0)`, and `s.c` is 1 - so nothing leaves. This is
        //     the second half of idempotence: a release for a contact that
        //     holds nothing must be silent.
        host.touchUp(0, xa, ya);
        host.tick();
        const third = voices.drain();
        report.push(
          `  finger 0 lifts (not the owner): ${third.join(" ") || "(nothing)"}` +
            ` - sounding ${voices.sounding.join(",")}`,
        );
        expect(
          third,
          "chorus: THE LIFT OF A FINGER THAT DOES NOT OWN THE CHORD MUST BE " +
            "SILENT. `R` returns unless `s.c` is the contact being expired; " +
            "without that test this lift would cut pad 5's chord dead",
        ).toEqual([]);
        expect(
          voices.peak,
          "chorus: NEVER MORE THAN THREE NOTES SOUNDING. Counted after every " +
            "single message, not after every step, so a release that arrived " +
            "AFTER the new note-ons would be caught here",
        ).toBe(3);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 2. THE CONTACT THAT GOES QUIET, released by the library's sweep and by
    //    nothing else. THE WINDOW IS THE CALLER'S: `X(self,100)` counts CHORUS's
    //    OWN Timer calls, and CHORUS fires at gtt(0,20) since change 7
    //    (2026-09-18; twenty calls at gtt(0,100) before it), so one hundred
    //    calls is two seconds - the same figure its private per-contact
    //    watchdog carried before plan 12-09 replaced it.
    // -----------------------------------------------------------------------
    const TIMER_MS = 20;
    const TICK_MS = 10;
    const WINDOW_CALLS = 100;
    const timerTicks = TIMER_MS / TICK_MS;
    {
      const { host } = await open(entry);
      const voices = tracker(host);
      try {
        // THE TICK IS COUNTED EXPLICITLY, because the number this stage
        // reports is a DATE and an off-by-one in the bookkeeping would move it.
        let ticks = 0;
        host.touchDown(0, xa, ya);
        host.tick();
        ticks += 1;
        voices.drain();
        expect(
          voices.sounding.length,
          "chorus: the chord never sounded, so its release proves nothing",
        ).toBe(3);

        // NINETY-NINE TIMER CALLS IS INSIDE THE WINDOW. Without this reading the
        // assertion below would pass on a sweep with no window at all. The
        // host's msClock starts at 0 and Setup's gtt(0,20) sets the first
        // deadline at 20 ms, so Timer call k lands on tick 2k.
        host.run((WINDOW_CALLS - 1) * timerTicks - ticks);
        ticks = (WINDOW_CALLS - 1) * timerTicks;
        const inside = voices.drain();
        expect(
          inside,
          "chorus: A CHORD INSIDE THE WINDOW MUST STILL BE SOUNDING. " +
            `Observed ${inside.join(" ")} after ${WINDOW_CALLS - 1} Timer calls`,
        ).toEqual([]);

        // Then one tick at a time, so the release is DATED rather than merely
        // observed to have happened somewhere in a long run.
        let releasedAt = -1;
        while (ticks < 2 * WINDOW_CALLS * timerTicks) {
          host.tick();
          ticks += 1;
          if (host.midi.length > 3) {
            releasedAt = ticks;
            break;
          }
        }
        const swept = voices.drain();
        const calls = releasedAt / timerTicks;
        report.push(
          `  finger 1 goes quiet: released on tick ${releasedAt} = Timer call ` +
            `${calls} at ${TIMER_MS} ms = ${(calls * TIMER_MS) / 1000} s ` +
            `- ${swept.join(" ")}`,
        );
        expect(
          swept,
          "chorus: A CHORD WHOSE FINGER WENT QUIET MUST BE RELEASED BY THE " +
            "TIMER. The firmware's change gate drops repeats, so a perfectly " +
            "still finger sends nothing at all, and Q6.5 measured four of five " +
            "contacts never sending their code 5 - `X(self,100)` plus `R` is " +
            `the only path that reaches either. Observed ${swept.join(" ")}`,
        ).toEqual(triadOf(PAD_A).map((n) => `128:${n}`));
        expect(voices.sounding, "nothing is left sounding").toEqual([]);
        expect(
          [releasedAt, calls],
          "chorus: THE WINDOW IS ONE HUNDRED OF CHORUS'S OWN TIMER CALLS and " +
            "the release lands on the hundred-and-first, because `X` expires a " +
            "stamp older than n calls rather than n-or-older. The DOWN is on " +
            `tick 1 and the stamp reads C = 0, so at gtt(0,${TIMER_MS}) the ` +
            "sweep reaches it on tick 202 - 2.02 s of wall time against a " +
            `two-second window. Observed tick ${releasedAt}, Timer call ${calls}`,
        ).toEqual([(WINDOW_CALLS + 1) * timerTicks, WINDOW_CALLS + 1]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 3. AND A FINGER THAT KEEPS REPORTING IS NOT RELEASED. `Q` stamps `T[i]`
    //    on every live sample, including the ones whose cell did not change, so
    //    only genuine silence expires a contact. Without this half the sweep
    //    would be a two-second kill switch on every held chord, which is the
    //    risk library.ts section 5 names and 12-12 hands to the bench.
    // -----------------------------------------------------------------------
    {
      const { host } = await open(entry);
      const voices = tracker(host);
      try {
        host.touchDown(0, xa, ya);
        host.tick();
        voices.drain();
        // The input has to VARY: the host change-gates its FIFO per contact on
        // (event, x, y), so a repeated identical MOVE would be dropped before
        // the VM saw it and this probe would be measuring the gate.
        for (let call = 0; call < 2 * WINDOW_CALLS; call += 1) {
          host.touchMove(0, xa + (call % 2), ya);
          host.run(timerTicks);
        }
        const held = voices.drain();
        report.push(
          `  finger held on pad ${PAD_A}, ${2 * WINDOW_CALLS} Timer calls of wobble: ` +
            `${held.join(" ") || "(nothing)"} - sounding ` +
            `${voices.sounding.join(",")}`,
        );
        expect(
          held,
          "chorus: A CHORD UNDER A FINGER THAT KEEPS REPORTING MUST NOT BE " +
            "SWEPT. Two hundred Timer calls is twice the window; the wobble stays " +
            `inside one pad, so nothing re-triggers either. Observed ${held.join(" ")}`,
        ).toEqual([]);
        expect(
          voices.sounding,
          "chorus: the same triad is still sounding after four seconds",
        ).toEqual([...triadOf(PAD_A)].sort((a, b) => a - b));
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nCHORUS, one chord at a time (plan 12-09):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length, "every stage of the chord probe ran").toBe(5);
  }, 120000);

  // -------------------------------------------------------------------------
  // TRACKPAD (plan 12-10): the vendored trackpad recipe kept whole, and the
  // edge flash painted from the Timer.
  //
  // Every gesture the tpad preset had is driven here and read off the wire,
  // because the fold replaced that preset with this card and the promise was
  // that nothing is lost: the pointer's relative motion, two-finger scroll,
  // tap-to-click, the fast tap that arrives as one code 9, right-click on
  // two, and the Timer's release of the button. Then the flash: the edge the
  // finger moves toward, centred on the finger's other coordinate, the
  // rounded profile the knobs can reach, every cell walking to phase 0 inside
  // D's 42-tick ceiling, and nothing lit for a scroll, a tap or a resting
  // finger. Last, the knob's off state is the plain trackpad.
  //
  // THE DECAY GATE CANNOT SEE THIS CARD, and this test is where its phase-0
  // guarantee lives instead: decay-idiom.spec.ts reads literal glpfs pairs,
  // and every write here goes through the library's `D(`. So the twelve
  // brightnesses the knobs can reach are computed below from the same formula
  // the Lua carries, asserted multiples of six inside 6..252, and then the VM
  // is read down to black.
  // -------------------------------------------------------------------------
  it("keeps every trackpad gesture and flashes the edge the finger moves toward, to phase 0, from the Timer", async () => {
    const entry = CATALOG.find((e) => e.id === "trackpad");
    if (!entry || entry.source.kind !== "lua") {
      throw new Error("TRACKPAD is not a Lua entry in the catalog");
    }
    const report: string[] = [];

    // ---- THE TWELVE, from the formula the Timer carries, by text.
    const FORMULA = "@T*(16-k*k)//16*6";
    expect(
      entry.source.timer.includes(FORMULA),
      "trackpad: the Timer's brightness formula is the one this test mirrors",
    ).toBe(true);
    const fadeKnob = entry.knobs.find((k) => k.id === "fade");
    const reachKnob = entry.knobs.find((k) => k.id === "reach");
    expect(fadeKnob, "the fade knob").toBeDefined();
    expect(reachKnob, "the reach knob").toBeDefined();
    const brightness = (t: number, k: number): number =>
      Math.floor((t * (16 - k * k)) / 16) * 6;
    const twelve: number[] = [];
    for (const t of fadeKnob!.values.map(Number)) {
      const widest = Math.max(...reachKnob!.values.map(Number));
      for (let k = 0; k <= Math.floor(widest / 2); k += 1) {
        const w = brightness(t, k);
        expect(
          w % 6,
          `trackpad: w=${w} at fade ${t}, k=${k} is a multiple of six`,
        ).toBe(0);
        expect(
          w,
          `trackpad: w at fade ${t}, k=${k} is inside D's ceiling`,
        ).toBeLessThanOrEqual(252);
        expect(
          w,
          `trackpad: w at fade ${t}, k=${k} is a real brightness`,
        ).toBeGreaterThanOrEqual(6);
        twelve.push(w);
      }
    }
    expect(twelve.length, "three fades times four offsets").toBe(12);
    report.push(`  the twelve: ${twelve.join(" ")}`);

    type Opened = Awaited<ReturnType<typeof open>>;
    const openWith = async (
      indices: Record<string, number> | undefined,
    ): Promise<Opened> => {
      const { setup, timer } = renderLua(entry, indices);
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer,
      });
      return { host, sim };
    };

    const phaseOf = (sim: PadSim, cell: number): number =>
      sim.layer(screenToHw(cell % 9, Math.floor(cell / 9)), 1).pha;
    const rateOf = (sim: PadSim, cell: number): number =>
      sim.layer(screenToHw(cell % 9, Math.floor(cell / 9)), 1).fre;
    const litCells = (frame: Uint8Array): number[] => {
      const out: number[] = [];
      for (let n = 0; n < CELLS; n += 1) {
        if (frame[n * 3] || frame[n * 3 + 1] || frame[n * 3 + 2]) out.push(n);
      }
      return out;
    };
    const hidOf = (
      hid: readonly HostHid[],
      call: HostHid["call"],
      first: number,
    ): number[] =>
      hid
        .filter((h) => h.call === call && h.args[0] === first)
        .map((h) => h.args[1]);

    /**
     * Drag one contact from (x, y) by (dx, dy) per sample, `steps` samples two
     * ticks apart, and return the tick of the first sample at which layer 1
     * lit anywhere, or -1.
     */
    const dragAndWatch = (
      opened: Opened,
      id: number,
      from: readonly [number, number],
      delta: readonly [number, number],
      steps: number,
    ): { firstLit: number; snapshot: number[]; ticksToDark: number } => {
      const { host, sim } = opened;
      let [x, y] = from;
      let firstLit = -1;
      let snapshot: number[] = [];
      const step = (n: number): void => {
        for (let i = 0; i < n; i += 1) {
          host.tick();
          if (firstLit === -1) {
            const lit = litCells(host.frame);
            if (lit.length > 0) {
              firstLit = host.tickCount;
              snapshot = Array.from({ length: CELLS }, (_, c) =>
                phaseOf(sim, c),
              );
            }
          }
        }
      };
      for (let i = 0; i < steps; i += 1) {
        x += delta[0];
        y += delta[1];
        host.touchMove(id, x, y);
        step(2);
      }
      // The last sample is dispatched; let the Timer paint it, then count
      // ticks until the pad is black again.
      step(2);
      let ticksToDark = 0;
      while (litCells(host.frame).length > 0 && ticksToDark < 200) {
        host.tick();
        ticksToDark += 1;
      }
      return { firstLit, snapshot, ticksToDark };
    };

    const cell = (col: number, row: number): number => row * 9 + col;

    // ======================================================================
    // 1. A rightward drag: the right column, centred on the finger's row.
    // ======================================================================
    const a = await openWith(undefined);
    try {
      const { host, sim } = a;
      expect(host.coordMax, "trackpad: both axes unlocked to ten bits").toBe(
        1023,
      );
      host.run(4);
      expect(litCells(host.frame), "trackpad: black at rest").toEqual([]);

      host.touchDown(0, 200, 511);
      host.run(2);
      const hidBefore = host.hid.length;
      const right = dragAndWatch(a, 0, [200, 511], [40, 0], 8);
      expect(
        right.firstLit,
        "trackpad: a rightward drag lit something",
      ).not.toBe(-1);
      // 511 * 9 // 1024 = 4: rows 2..6 of column 8, at the defaults (5 cells,
      // fade 42): centre 252, then 234, then 186 - each read one tick after
      // the Timer wrote it, so minus six.
      const expectRight = new Map<number, number>([
        [cell(8, 4), 246],
        [cell(8, 3), 228],
        [cell(8, 5), 228],
        [cell(8, 2), 180],
        [cell(8, 6), 180],
      ]);
      for (let c = 0; c < CELLS; c += 1) {
        expect(
          right.snapshot[c],
          `trackpad: cell ${c} (col ${c % 9}, row ${Math.floor(c / 9)}) at the first lit tick`,
        ).toBe(expectRight.get(c) ?? 0);
      }
      report.push(
        `  right drag: first lit at tick ${right.firstLit}; column 8 rows 2..6 = ` +
          `${[2, 3, 4, 5, 6].map((r) => right.snapshot[cell(8, r)]).join(" ")}; ` +
          `column 0 = ${[0, 4, 8].map((r) => right.snapshot[cell(0, r)]).join(" ")}; ` +
          `dark again ${right.ticksToDark} ticks after the last paint`,
      );
      expect(
        right.ticksToDark,
        "trackpad: every flashed cell reaches black inside D's 42-tick ceiling",
      ).toBeLessThanOrEqual(42);
      for (let c = 0; c < CELLS; c += 1) {
        expect(
          phaseOf(sim, c),
          `trackpad: cell ${c} phase after the fade`,
        ).toBe(0);
        expect(rateOf(sim, c), `trackpad: cell ${c} rate after the fade`).toBe(
          0,
        );
      }

      // The wire: every pointer delta positive on x, zero on y, after the
      // four-sample hold-off.
      const sinceA = host.hid.slice(hidBefore);
      const xs = hidOf(sinceA, "gmms", 1);
      const ys = hidOf(sinceA, "gmms", 2);
      expect(xs.length, "trackpad: the drag sent pointer x").toBeGreaterThan(0);
      expect(
        xs.every((v) => v > 0 && v <= 63),
        `trackpad: every x delta positive and inside +-63: ${xs.join(" ")}`,
      ).toBe(true);
      expect(
        ys.every((v) => v === 0),
        `trackpad: no y motion on a horizontal drag: ${ys.join(" ")}`,
      ).toBe(true);
      // MEASURED, NOT ASSUMED: `s.j=4` on the onset, decremented once per
      // handler CALL - the down's own dispatch takes it to 3, and the next
      // three moves take it to 0 - so the hold-off swallows THREE moves and
      // the fourth is the first the pointer sees. The test first expected
      // four and the VM said five of eight were sent.
      expect(
        xs.length,
        "trackpad: the hold-off swallowed the first three moves of eight",
      ).toBe(8 - 3);
      report.push(`  right drag wire: x ${xs.join(" ")}, y ${ys.join(" ")}`);

      // ==================================================================
      // 2. An upward drag from where the finger is: the top row, centred
      //    on the finger's column, and the bottom row dark.
      // ==================================================================
      const hidBeforeUp = host.hid.length;
      const up = dragAndWatch(a, 0, [520, 511], [0, -40], 8);
      expect(up.firstLit, "trackpad: an upward drag lit something").not.toBe(
        -1,
      );
      // 520 * 9 // 1024 = 4: columns 2..6 of row 0.
      const expectUp = new Map<number, number>([
        [cell(4, 0), 246],
        [cell(3, 0), 228],
        [cell(5, 0), 228],
        [cell(2, 0), 180],
        [cell(6, 0), 180],
      ]);
      for (let c = 0; c < CELLS; c += 1) {
        expect(
          up.snapshot[c],
          `trackpad: cell ${c} at the first lit tick of the upward drag`,
        ).toBe(expectUp.get(c) ?? 0);
      }
      const ups = hidOf(host.hid.slice(hidBeforeUp), "gmms", 2);
      expect(
        ups.length > 0 && ups.every((v) => v < 0),
        `trackpad: every y delta negative on an upward drag: ${ups.join(" ")}`,
      ).toBe(true);
      report.push(
        `  up drag: row 0 cols 2..6 = ${[2, 3, 4, 5, 6].map((c) => up.snapshot[cell(c, 0)]).join(" ")}; wire y ${ups.join(" ")}`,
      );

      // ==================================================================
      // 3. The lift after a drag is not a tap: no click.
      // ==================================================================
      const clicksBeforeLift = hidOf(host.hid, "gmbs", 1).length;
      host.touchUp(0, 520, 191);
      host.run(4);
      expect(
        hidOf(host.hid, "gmbs", 1).length,
        "trackpad: a drag's lift sends no click",
      ).toBe(clicksBeforeLift);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);

      // ==================================================================
      // 4. A tap clicks, flashes nothing, and the Timer releases the button
      //    four calls later.
      // ==================================================================
      host.run(60); // more than 25 Timer calls: the next touch is a fresh gesture
      const hidBeforeTap = host.hid.length;
      host.touchDown(1, 600, 600);
      host.run(2);
      host.touchUp(1, 600, 600);
      host.run(2);
      const afterTap = host.hid.slice(hidBeforeTap);
      const press = afterTap.findIndex(
        (h) => h.call === "gmbs" && h.args[0] === 1 && h.args[1] === 1,
      );
      expect(press, "trackpad: a tap presses button 1").toBeGreaterThanOrEqual(
        0,
      );
      expect(
        litCells(host.frame),
        "trackpad: a tap has no motion, so it flashes nothing",
      ).toEqual([]);
      host.run(8);
      const release = host.hid
        .slice(hidBeforeTap)
        .findIndex(
          (h) => h.call === "gmbs" && h.args[0] === 3 && h.args[1] === 0,
        );
      expect(
        release,
        "trackpad: the Timer released the button within four calls",
      ).toBeGreaterThan(press);
      report.push(`  tap: press at hid ${press}, release at hid ${release}`);

      // ==================================================================
      // 5. A hardware fast tap - one code 9 - clicks too. This is the case the
      //    three touch-guard rows exist for.
      // ==================================================================
      host.run(60);
      const hidBeforeFast = host.hid.length;
      host.touchTap(1, 300, 300);
      host.run(2);
      expect(
        hidOf(host.hid.slice(hidBeforeFast), "gmbs", 1),
        "trackpad: a fast tap (code 9) presses button 1",
      ).toEqual([1]);
      host.run(10);

      // ==================================================================
      // 6. Two fingers down and up together: button 2, the right click.
      // ==================================================================
      host.run(60);
      const hidBeforeRight = host.hid.length;
      host.touchDown(0, 300, 300);
      host.run(2);
      host.touchDown(1, 500, 300);
      host.run(2);
      host.touchUp(0, 300, 300);
      host.run(2);
      host.touchUp(1, 500, 300);
      host.run(2);
      expect(
        hidOf(host.hid.slice(hidBeforeRight), "gmbs", 2),
        "trackpad: two fingers tapping press button 2",
      ).toEqual([1]);
      expect(
        hidOf(host.hid.slice(hidBeforeRight), "gmbs", 1),
        "trackpad: and not button 1",
      ).toEqual([]);
      host.run(10);

      // ==================================================================
      // 7. Two fingers moving down: scroll notches, no pointer, no flash,
      //    and the lift is not a click.
      // ==================================================================
      host.run(60);
      const hidBeforeScroll = host.hid.length;
      host.touchDown(0, 300, 300);
      host.run(2);
      host.touchDown(1, 500, 300);
      host.run(2);
      let y0 = 300;
      let litDuringScroll = 0;
      for (let i = 0; i < 10; i += 1) {
        y0 += 30;
        host.touchMove(0, 300, y0);
        host.run(2);
        host.touchMove(1, 500, y0);
        host.run(2);
        litDuringScroll = Math.max(
          litDuringScroll,
          litCells(host.frame).length,
        );
      }
      const scroll = host.hid.slice(hidBeforeScroll);
      const notches = hidOf(scroll, "gmms", 3);
      expect(
        notches.length > 0 && notches.every((v) => v < 0),
        `trackpad: a downward two-finger drag scrolls, inverted as the recipe has it: ${notches.join(" ")}`,
      ).toBe(true);
      expect(
        hidOf(scroll, "gmms", 1).length + hidOf(scroll, "gmms", 2).length,
        "trackpad: two fingers move the pointer not at all",
      ).toBe(0);
      expect(litDuringScroll, "trackpad: a scroll flashes nothing").toBe(0);
      const clicksBeforeScrollLift =
        hidOf(host.hid, "gmbs", 1).length + hidOf(host.hid, "gmbs", 2).length;
      host.touchUp(0, 300, y0);
      host.run(2);
      host.touchUp(1, 500, y0);
      host.run(2);
      expect(
        hidOf(host.hid, "gmbs", 1).length + hidOf(host.hid, "gmbs", 2).length,
        "trackpad: a scroll's lift is not a click",
      ).toBe(clicksBeforeScrollLift);
      report.push(`  scroll: notches ${notches.join(" ")}`);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      a.host.close();
    }

    // ======================================================================
    // 8. The knobs: seven cells, the short fade, and OFF.
    // ======================================================================
    const wide = await openWith({ flash: 0, colour: 0, reach: 2, fade: 2 });
    try {
      wide.host.run(4);
      wide.host.touchDown(0, 200, 511);
      wide.host.run(2);
      const r = dragAndWatch(wide, 0, [200, 511], [40, 0], 8);
      expect(r.firstLit, "trackpad: seven cells lit something").not.toBe(-1);
      // fade 21: 126 114 90 54 (the header's third line of the twelve), each
      // minus six for the tick that read it; rows 1..7 of column 8.
      const expectWide = new Map<number, number>([
        [cell(8, 4), 120],
        [cell(8, 3), 108],
        [cell(8, 5), 108],
        [cell(8, 2), 84],
        [cell(8, 6), 84],
        [cell(8, 1), 48],
        [cell(8, 7), 48],
      ]);
      for (let c = 0; c < CELLS; c += 1) {
        expect(
          r.snapshot[c],
          `trackpad: cell ${c} at the first lit tick, seven cells and fade 21`,
        ).toBe(expectWide.get(c) ?? 0);
      }
      expect(
        r.ticksToDark,
        "trackpad: the short fade reaches black inside 21 ticks",
      ).toBeLessThanOrEqual(21);
      report.push(
        `  seven cells, fade 21: column 8 rows 0..8 = ${Array.from({ length: 9 }, (_, row) => r.snapshot[cell(8, row)]).join(" ")}; dark after ${r.ticksToDark}`,
      );
      expect(wide.host.errors, wide.host.errors.join(" | ")).toEqual([]);
    } finally {
      wide.host.close();
    }

    const off = await openWith({ flash: 1, colour: 0, reach: 1, fade: 0 });
    try {
      off.host.run(4);
      off.host.touchDown(0, 200, 511);
      off.host.run(2);
      const hidBefore = off.host.hid.length;
      const r = dragAndWatch(off, 0, [200, 511], [40, 0], 8);
      expect(
        r.firstLit,
        "trackpad: with the flash off nothing lights - the plain trackpad",
      ).toBe(-1);
      const xs = hidOf(off.host.hid.slice(hidBefore), "gmms", 1);
      expect(
        xs.length > 0 && xs.every((v) => v > 0),
        `trackpad: and the pointer still moves: ${xs.join(" ")}`,
      ).toBe(true);
      expect(off.host.errors, off.host.errors.join(" | ")).toEqual([]);
      report.push(`  flash off: nothing lit, pointer x ${xs.join(" ")}`);
    } finally {
      off.host.close();
    }

    process.stdout.write(
      "\nTRACKPAD, every gesture and the edge flash (plan 12-10):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length, "every stage of the trackpad probe ran").toBe(8);
  }, 120000);

  // -------------------------------------------------------------------------
  // TRACKPAD COMET (2026-09-17, BENCH-2026-09-16.txt section 4): TRACKPAD's
  // recipe, byte for byte, with a comet under the finger instead of the edge
  // flash - the library's `G` drawing the finger on layer 0 and `D` re-arming
  // the nearest calibrated cell on layer 1, both from the Timer, at every
  // held contact (GHOST's comet shape).
  //
  // Six claims. The Setup IS TRACKPAD's string (a comparison, not a review).
  // The wire is TRACKPAD's for the same gestures: both entries are driven
  // through one script - a drag, its lift, a tap, a fast tap, a two-finger
  // tap and a two-finger scroll - and the two HID logs are asserted equal
  // call for call. A landed finger is drawn as `G`'s twin on layer 0 (the
  // 12.1-02 arithmetic from KX / KY) over its nearest cell re-armed at the
  // tail's start on layer 1; a drag leaves every cell it crossed decaying at
  // full length, the earliest dimmest; a lift clears the head inside one
  // Timer call and lets the trail reach phase 0 inside the tail's ticks, at
  // the longest and the shortest tail; a still finger holds its head and its
  // cell for as long as the recipe holds the gesture and loses both once the
  // idle window closes, finger still down; and the scroll knob decides
  // whether two scrolling fingers leave two comets or none.
  //
  // WHY NOT `K` ALONE, MEASURED HERE FIRST: a stamp re-written every call at
  // the cell's falling bilinear weight dims a cell the finger is leaving to
  // its last small start (6 or 12, gone in a tick or two), so a slow finger
  // left almost no trail. The whole-cell re-arm through `D(N(x,y))` keeps a
  // left cell at its last full start and decays it from there.
  //
  // THE DECAY GATE CANNOT SEE THIS CARD EITHER: every trail write goes
  // through `D(`, so the walk to black here is its phase-0 proof.
  // -------------------------------------------------------------------------
  it("carries TRACKPAD's Setup byte for byte and its wire call for call, and paints a comet that follows the finger, holds under a still one, and fades to phase 0 inside the tail", async () => {
    const entry = CATALOG.find((e) => e.id === "trackpad-comet");
    const trackpad = CATALOG.find((e) => e.id === "trackpad");
    if (!entry || entry.source.kind !== "lua") {
      throw new Error("TRACKPAD COMET is not a Lua entry in the catalog");
    }
    if (!trackpad || trackpad.source.kind !== "lua") {
      throw new Error("TRACKPAD is not a Lua entry in the catalog");
    }
    const report: string[] = [];

    // ---- 1. THE SETUP IS TRACKPAD'S STRING; only the Timer differs.
    expect(
      entry.source.setup,
      "trackpad-comet: the Setup is TRACKPAD's, byte for byte",
    ).toBe(trackpad.source.setup);
    expect(entry.source.timer, "trackpad-comet: the Timer is its own").not.toBe(
      trackpad.source.timer,
    );
    const PAINT = "G(s,i,1,x,y,0,@H)D(N(x,y),1,@T*6)";
    expect(
      entry.source.timer.includes(PAINT),
      "trackpad-comet: the Timer's head and trail are the pair this test mirrors",
    ).toBe(true);
    const tailKnob = entry.knobs.find((k) => k.id === "tail");
    const scrollKnob = entry.knobs.find((k) => k.id === "scroll");
    expect(tailKnob, "the tail knob").toBeDefined();
    expect(scrollKnob, "the scroll knob").toBeDefined();
    const tails = tailKnob!.values.map(Number);
    for (const t of tails) {
      expect((t * 6) % 6, `tail ${t}: the start is a multiple of six`).toBe(0);
      expect(t * 6, `tail ${t}: inside D's ceiling`).toBeLessThanOrEqual(252);
      expect(t * 6, `tail ${t}: a real brightness`).toBeGreaterThanOrEqual(6);
    }
    report.push(`  the starts: ${tails.map((t) => t * 6).join(" ")}`);

    type Opened = Awaited<ReturnType<typeof open>>;
    const openWith = async (
      which: CatalogEntry,
      indices: Record<string, number> | undefined,
    ): Promise<Opened> => {
      const { setup, timer } = renderLua(which, indices);
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer,
      });
      return { host, sim };
    };
    const layerOf = (sim: PadSim, cell: number, layer: 0 | 1) =>
      sim.layer(screenToHw(cell % 9, Math.floor(cell / 9)), layer);
    const litCells = (frame: Uint8Array): number[] => {
      const out: number[] = [];
      for (let n = 0; n < CELLS; n += 1) {
        if (frame[n * 3] || frame[n * 3 + 1] || frame[n * 3 + 2]) out.push(n);
      }
      return out;
    };
    /** The raw sensor pair the Timer hands the library for a hi-res finger. */
    const raw = (x: number, y: number): [number, number] => [
      Math.floor(x / 8),
      Math.floor(y / 8),
    ];
    /** `N`'s twin: the nearest calibrated cell of a hi-res finger. */
    const nearestCell = (x: number, y: number): number => {
      const [rx, ry] = raw(x, y);
      return (
        Math.floor((calibratedAxis(rx, "x") + 32) / LED_STEP) +
        Math.floor((calibratedAxis(ry, "y") + 32) / LED_STEP) * 9
      );
    };
    /**
     * `G`'s twin for a hi-res finger: the four cells of the block and their
     * layer-0 phases, 255 * weight // 4096 - the 12.1-02 arithmetic.
     */
    const expectedHead = (x: number, y: number): Record<number, number> => {
      const [rx, ry] = raw(x, y);
      const u = calibratedAxis(rx, "x");
      const v = calibratedAxis(ry, "y");
      const c = Math.min(Math.floor(u / LED_STEP), 7);
      const q = Math.min(Math.floor(v / LED_STEP), 7);
      const f = u - c * LED_STEP;
      const h = v - q * LED_STEP;
      const out: Record<number, number> = {};
      for (let d = 0; d < 4; d += 1) {
        const weight =
          (d % 2 > 0 ? f : LED_STEP - f) *
          (Math.floor(d / 2) > 0 ? h : LED_STEP - h);
        out[c + q * 9 + (d % 2) + Math.floor(d / 2) * 9] = Math.floor(
          (255 * weight) / 4096,
        );
      }
      return out;
    };
    /** Layer 0 as drawn: every cell with a non-zero phase. */
    const headOn = (sim: PadSim): Record<number, number> => {
      const out: Record<number, number> = {};
      for (let cell = 0; cell < CELLS; cell += 1) {
        const p = layerOf(sim, cell, 0).pha;
        if (p !== 0) out[cell] = p;
      }
      return out;
    };
    /** Every cell of layer 1 with a countdown running: cell -> phase. */
    const running = (sim: PadSim): Record<number, number> => {
      const out: Record<number, number> = {};
      for (let cell = 0; cell < CELLS; cell += 1) {
        const L = layerOf(sim, cell, 1);
        if (L.fre === 0 && L.timeout === 0) continue;
        out[cell] = L.pha;
      }
      return out;
    };
    /**
     * A held finger: the head is `G`'s block exactly (layer 0 is set, not
     * decayed), and the nearest cell is re-armed every Timer call (two
     * ticks), so read after a tick it sits six or twelve below the start.
     */
    const expectHeld = (
      sim: PadSim,
      x: number,
      y: number,
      w: number,
      label: string,
    ): { cell: number; head: Record<number, number> } => {
      const head = expectedHead(x, y);
      const drawn = headOn(sim);
      const nonZero = Object.fromEntries(
        Object.entries(head).filter(([, p]) => p !== 0),
      );
      expect(drawn, `${label}: layer 0 is G's block`).toEqual(nonZero);
      const cell = nearestCell(x, y);
      const pha = running(sim)[cell];
      expect(
        pha !== undefined && pha >= w - 12 && pha <= w,
        `${label}: the nearest cell ${cell} at ${pha}, expected within twelve below ${w}`,
      ).toBe(true);
      return { cell, head: nonZero };
    };
    const ticksToDark = (host: Opened["host"]): number => {
      let n = 0;
      while (litCells(host.frame).length > 0 && n < 200) {
        host.tick();
        n += 1;
      }
      return n;
    };
    const expectAllZero = (sim: PadSim, label: string): void => {
      for (let cell = 0; cell < CELLS; cell += 1) {
        const L = layerOf(sim, cell, 1);
        expect(
          [L.pha, L.fre, L.timeout],
          `${label}: layer 1 cell ${cell} did not land on 0`,
        ).toEqual([0, 0, 0]);
        expect(
          layerOf(sim, cell, 0).pha,
          `${label}: layer 0 cell ${cell} is not clear`,
        ).toBe(0);
      }
    };
    const DEFAULT_W = tails[0] * 6;

    // ---- 2. THE WIRE IS TRACKPAD'S, call for call, over one script.
    const script = (o: Opened): (string | number)[][] => {
      const { host } = o;
      host.run(4);
      host.touchDown(0, 200, 511);
      host.run(2);
      let x = 200;
      for (let i = 0; i < 8; i += 1) {
        x += 40;
        host.touchMove(0, x, 511);
        host.run(2);
      }
      host.touchUp(0, x, 511);
      host.run(60);
      host.touchDown(1, 600, 600);
      host.run(2);
      host.touchUp(1, 600, 600);
      host.run(60);
      host.touchTap(1, 300, 300);
      host.run(60);
      host.touchDown(0, 300, 300);
      host.run(2);
      host.touchDown(1, 500, 300);
      host.run(2);
      host.touchUp(0, 300, 300);
      host.run(2);
      host.touchUp(1, 500, 300);
      host.run(60);
      host.touchDown(0, 300, 300);
      host.run(2);
      host.touchDown(1, 500, 300);
      host.run(2);
      let y = 300;
      for (let i = 0; i < 10; i += 1) {
        y += 30;
        host.touchMove(0, 300, y);
        host.run(2);
        host.touchMove(1, 500, y);
        host.run(2);
      }
      host.touchUp(0, 300, y);
      host.run(2);
      host.touchUp(1, 500, y);
      host.run(60);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      return host.hid.map((h) => [h.call, ...h.args]);
    };
    const theirs = await openWith(trackpad, undefined);
    let wireTrackpad: (string | number)[][];
    try {
      wireTrackpad = script(theirs);
    } finally {
      theirs.host.close();
    }
    const ours = await openWith(entry, undefined);
    let wireComet: (string | number)[][];
    try {
      wireComet = script(ours);
    } finally {
      ours.host.close();
    }
    expect(
      wireTrackpad.length,
      "the script sent something on TRACKPAD",
    ).toBeGreaterThan(20);
    expect(
      wireComet,
      "trackpad-comet: the HID log is TRACKPAD's, call for call",
    ).toEqual(wireTrackpad);
    const calls = (name: string): number =>
      wireComet.filter((h) => h[0] === name).length;
    report.push(
      `  wire identical to TRACKPAD's over the script: ${wireComet.length} HID calls (gmms ${calls("gmms")}, gmbs ${calls("gmbs")})`,
    );

    // ---- 3. A LANDED FINGER IS G'S BLOCK OVER ITS CELL; a drag trails at
    //         full length; a lift clears the head and fades the trail to
    //         phase 0 inside the tail.
    const a = await openWith(entry, undefined);
    try {
      const { host, sim } = a;
      expect(host.coordMax, "trackpad-comet: both axes unlocked").toBe(1023);
      host.run(4);
      expect(litCells(host.frame), "trackpad-comet: black at rest").toEqual([]);
      host.touchDown(0, 200, 511);
      host.run(3);
      const landed = expectHeld(sim, 200, 511, DEFAULT_W, "a landed finger");
      report.push(
        `  landed at (200,511): head ${Object.entries(landed.head)
          .map(([c, p]) => `${c}=${p}`)
          .join(" ")}, trail cell ${landed.cell} armed at ${DEFAULT_W}`,
      );

      // The drag: eight moves right, 40 hi-res units each, two ticks apart;
      // the cells whose turn it was to be nearest, in order.
      let x = 200;
      const visited: number[] = [landed.cell];
      for (let i = 0; i < 8; i += 1) {
        x += 40;
        host.touchMove(0, x, 511);
        host.run(2);
        const n = nearestCell(x, 511);
        if (!visited.includes(n)) visited.push(n);
      }
      host.run(1);
      const trail = running(sim);
      const headCell = nearestCell(x, 511);
      const behind = visited.filter((c) => c !== headCell);
      expect(
        behind.length,
        "trackpad-comet: the drag crossed cells behind the head",
      ).toBeGreaterThan(1);
      for (const c of visited) {
        expect(
          trail[c] !== undefined,
          `trackpad-comet: cell ${c} the finger crossed is still decaying`,
        ).toBe(true);
      }
      for (let i = 0; i < behind.length; i += 1) {
        expect(
          trail[behind[i]] < trail[headCell],
          `trackpad-comet: cell ${behind[i]} behind the head (${trail[behind[i]]}) is dimmer than the head cell (${trail[headCell]})`,
        ).toBe(true);
        if (i > 0) {
          expect(
            trail[behind[i - 1]] < trail[behind[i]],
            `trackpad-comet: the trail rises toward the head: ${behind[i - 1]}=${trail[behind[i - 1]]} then ${behind[i]}=${trail[behind[i]]}`,
          ).toBe(true);
        }
      }
      expect(
        Object.keys(headOn(sim))
          .map(Number)
          .sort((p, q) => p - q),
        "trackpad-comet: the head follows the finger",
      ).toEqual(
        Object.entries(expectedHead(x, 511))
          .filter(([, p]) => p !== 0)
          .map(([c]) => Number(c))
          .sort((p, q) => p - q),
      );
      report.push(
        `  a rightward drag: head cell ${headCell} at ${trail[headCell]}, behind it ${behind.map((c) => `${c}=${trail[c]}`).join(" ")}`,
      );

      // The lift: the head is cleared inside one Timer call, the trail
      // reaches black inside the tail, every cell on 0 on both layers.
      host.touchUp(0, x, 511);
      host.run(3);
      expect(
        headOn(sim),
        "trackpad-comet: the head is cleared inside one Timer call of the lift",
      ).toEqual({});
      const dark = ticksToDark(host);
      expect(
        dark,
        "trackpad-comet: after the lift the trail is black inside 42 ticks",
      ).toBeLessThanOrEqual(tails[0] + 2);
      expectAllZero(sim, "after the lift");
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      report.push(
        `  lift: head cleared, black after ${dark} more ticks, every cell on phase 0`,
      );

      // ---- 4. A STILL FINGER HOLDS ITS HEAD AND ITS CELL for as long as the
      //         recipe holds the gesture, then loses both once the idle
      //         window (25 quiet Timer calls) closes - finger still down.
      host.run(60);
      host.touchDown(0, 600, 600);
      host.run(3);
      const still = expectHeld(
        sim,
        600,
        600,
        DEFAULT_W,
        "a still finger at 3 ticks",
      );
      host.run(44);
      expectHeld(sim, 600, 600, DEFAULT_W, "a still finger at 47 ticks");
      host.run(60);
      expect(
        litCells(host.frame),
        "trackpad-comet: past the recipe's idle window the comet has gone with the finger still down",
      ).toEqual([]);
      expectAllZero(sim, "past the idle window");
      host.touchUp(0, 600, 600);
      host.run(4);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      report.push(
        `  a still finger: head ${Object.entries(still.head)
          .map(([c, p]) => `${c}=${p}`)
          .join(
            " ",
          )} and cell ${still.cell} held at 47 ticks, black once 25 quiet calls passed`,
      );
    } finally {
      a.host.close();
    }

    // ---- 5. THE SHORTEST TAIL fades inside its own ticks.
    const short = await openWith(entry, { tail: 2 });
    try {
      const { host, sim } = short;
      const w = tails[2] * 6;
      host.run(4);
      host.touchDown(0, 200, 511);
      host.run(3);
      expectHeld(sim, 200, 511, w, "the short tail's head");
      let x = 200;
      for (let i = 0; i < 8; i += 1) {
        x += 40;
        host.touchMove(0, x, 511);
        host.run(2);
      }
      host.touchUp(0, x, 511);
      host.run(3);
      const dark = ticksToDark(host);
      expect(
        dark,
        `trackpad-comet: tail ${tails[2]} is black inside its own ticks`,
      ).toBeLessThanOrEqual(tails[2] + 2);
      expectAllZero(sim, "after the short tail");
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      report.push(`  tail ${tails[2]}: black after ${dark} ticks`);
    } finally {
      short.host.close();
    }

    // ---- 6. THE SCROLL KNOB: two comets under two scrolling fingers at
    //         `true`, none at `false` once the first finger's own arm has
    //         run down.
    const scrollWith = async (
      index: number,
    ): Promise<{
      lit: number[];
      notches: number[];
      cells: number[];
      heads: number;
    }> => {
      const o = await openWith(entry, { scroll: index });
      try {
        const { host, sim } = o;
        host.run(4);
        host.touchDown(0, 300, 300);
        host.run(2);
        host.touchDown(1, 500, 300);
        host.run(2);
        let y = 300;
        const hidBefore = host.hid.length;
        for (let i = 0; i < 12; i += 1) {
          y += 30;
          host.touchMove(0, 300, y);
          host.run(2);
          host.touchMove(1, 500, y);
          host.run(2);
        }
        host.run(1);
        const lit = litCells(host.frame);
        const cells = [nearestCell(300, y), nearestCell(500, y)];
        const heads = Object.keys(headOn(sim)).length;
        const notches = host.hid
          .slice(hidBefore)
          .filter((h) => h.call === "gmms" && h.args[0] === 3)
          .map((h) => h.args[1]);
        host.touchUp(0, 300, y);
        host.run(2);
        host.touchUp(1, 500, y);
        host.run(2);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        return { lit, notches, cells, heads };
      } finally {
        o.host.close();
      }
    };
    const both = await scrollWith(0);
    expect(
      both.notches.length > 0 && both.notches.every((v) => v < 0),
      `trackpad-comet: the two-finger drag scrolls: ${both.notches.join(" ")}`,
    ).toBe(true);
    for (const c of both.cells) {
      expect(
        both.lit.includes(c),
        `trackpad-comet: scroll=true lights cell ${c} under a scrolling finger`,
      ).toBe(true);
    }
    expect(
      both.heads,
      "trackpad-comet: scroll=true draws two heads",
    ).toBeGreaterThanOrEqual(2);
    const none = await scrollWith(1);
    expect(
      none.notches,
      "trackpad-comet: the scroll knob does not touch the wire",
    ).toEqual(both.notches);
    expect(
      none.lit,
      "trackpad-comet: scroll=false lights nothing under two fingers",
    ).toEqual([]);
    expect(none.heads, "trackpad-comet: scroll=false draws no head").toBe(0);
    report.push(
      `  scroll: notches ${both.notches.join(" ")}; true lights ${both.lit.length} cells (the two cells ${both.cells.join(" ")} among them, ${both.heads} head cells), false lights none`,
    );

    process.stdout.write(
      "\nTRACKPAD COMET, the recipe's wire and the comet (2026-09-17):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length, "every stage of the comet probe ran").toBe(8);
  }, 120000);

  // -------------------------------------------------------------------------
  // CHORUS, change 7 (2026-09-18, BENCH-2026-09-16.txt section 7): the lowest
  // chord at the bottom-left, twelve chromatic roots, two octave pads on the top
  // row, Smart inversion, and the picture painted from the Timer's first call.
  // -------------------------------------------------------------------------
  it("lands CHORUS's I chord at the bottom-left in root position on every key, walks the seven degrees upward, shifts the set by an octave from the two top-right pads and refuses past two, sends nothing from an octave pad, voices Smart as the closest inversion and Off as root position, and lights the picture and the shift from the Timer", async () => {
    const entry = entryById("chorus");
    const velocity = knobValueOf(entry, "velocity");
    const keyKnob = entry.knobs.find((knob) => knob.id === "key");
    const scaleKnob = entry.knobs.find((knob) => knob.id === "scale");
    const inversionKnob = entry.knobs.find((knob) => knob.id === "inversion");
    if (!keyKnob || !scaleKnob || !inversionKnob)
      throw new Error("chorus: key, scale and inversion knobs expected");
    expect(keyKnob.values, "chorus: the twelve chromatic roots C3..B3").toEqual(
      Array.from({ length: 12 }, (_, i) => String(48 + i)),
    );
    expect(inversionKnob.values, "chorus: Off then Smart").toEqual(["0", "2"]);
    const scale = scaleKnob.values[entry.defaults.scale].split(",").map(Number);

    /** The triad the entry bakes for chord pad z: degrees z, z+2, z+4 over the key. */
    const rootOf = (key: number, z: number): number[] =>
      [0, 1, 2].map((j) => {
        const d = z + j * 2;
        return key + scale[d % 7] + Math.floor(d / 7) * 12;
      });
    /**
     * The centre of pad z in raw coordinates, the entry's own u, v: column
     * z%3*3+1, row 7-z//3*3 (row 0 is the top). Pads 7 and 8 are the octave pads.
     */
    const padXY = (z: number): [number, number] => [
      cellCentre((z % 3) * 3 + 1),
      cellCentre(7 - Math.floor(z / 3) * 3),
    ];
    const DOWN = 7;
    const UP = 8;

    async function openWith(over: Record<string, number>) {
      const { setup, timer } = renderLua(entry, { ...entry.defaults, ...over });
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer,
      });
      return { host, sim };
    }
    type Opened = Awaited<ReturnType<typeof openWith>>;
    /** A press on pad z by contact id, then two ticks so the Timer runs once. */
    const press = ({ host }: Opened, z: number, id = 0): void => {
      const [x, y] = padXY(z);
      host.touchDown(id, x, y);
      host.run(2);
    };
    const lift = ({ host }: Opened, z: number, id = 0): void => {
      const [x, y] = padXY(z);
      host.touchUp(id, x, y);
      host.run(2);
    };
    /** Everything since `from`, as `cmd:pitch:velocity`. */
    const since = ({ host }: Opened, from: number): string[] =>
      host.midi.slice(from).map((m) => `${m.cmd}:${m.p1}:${m.p2}`);
    const ons = (notes: number[]): string[] =>
      notes.map((n) => `144:${n}:${velocity}`);
    const offs = (notes: number[]): string[] => notes.map((n) => `128:${n}:0`);
    const phaseOf = ({ sim }: Opened, cell: number): number =>
      sim.layer(hwOfCell(cell), 1).pha;
    const colourOf = ({ sim }: Opened, cell: number): number[] =>
      sim.layer(hwOfCell(cell), 1).max;
    /** One cell of each pad, for the picture reads. */
    const cellOf = (z: number): number =>
      (z % 3) * 3 + 1 + (7 - Math.floor(z / 3) * 3) * 9;

    const report: string[] = [];

    // -----------------------------------------------------------------------
    // 1. EVERY KEY: the bottom-left pad is the I chord in root position at the
    //    root, and the seven pads walk the degrees upward from there.
    // -----------------------------------------------------------------------
    for (let key = 0; key < 12; key += 1) {
      const opened = await openWith({ key });
      try {
        press(opened, 0);
        expect(
          since(opened, 0),
          `chorus at key ${48 + key}: the bottom-left pad is the I chord in root position`,
        ).toEqual(ons(rootOf(48 + key, 0)));
        lift(opened, 0);
        expect(opened.host.errors, opened.host.errors.join(" | ")).toEqual([]);
      } finally {
        opened.host.close();
      }
    }
    {
      const opened = await openWith({});
      try {
        let lowest = -1;
        const walk: string[] = [];
        for (let z = 0; z < 7; z += 1) {
          const from = opened.host.midi.length;
          press(opened, z);
          const sent = since(opened, from);
          const triad = rootOf(48, z);
          // The previous pad was lifted, so this press is its three note-ons alone.
          expect(
            sent,
            `chorus: pad ${z} is degree ${z + 1} in root position`,
          ).toEqual(ons(triad));
          expect(
            triad[0],
            `chorus: pad ${z}'s lowest note rises with the pad`,
          ).toBeGreaterThan(lowest);
          lowest = triad[0];
          walk.push(`${z}:${triad.join("/")}`);
          lift(opened, z);
        }
        report.push(
          `  the seven pads at C3, bottom-left first: ${walk.join(" ")}`,
        );
        expect(opened.host.errors, opened.host.errors.join(" | ")).toEqual([]);
      } finally {
        opened.host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 2. THE OCTAVE PADS: +12 per press up to two, refused past the ends, no
    //    MIDI of their own, the sounding chord's notes kept, the shift shown.
    // -----------------------------------------------------------------------
    {
      const opened = await openWith({});
      try {
        // Before the first Timer call the picture is dark; after it, lit.
        expect(
          [phaseOf(opened, cellOf(0)), phaseOf(opened, cellOf(UP))],
          "chorus: dark until the Timer's first call",
        ).toEqual([0, 0]);
        opened.host.run(2);
        expect(
          [
            phaseOf(opened, cellOf(0)),
            phaseOf(opened, cellOf(6)),
            phaseOf(opened, cellOf(DOWN)),
            phaseOf(opened, cellOf(UP)),
          ],
          "chorus: the chord pads at 255 and both octave pads at 40 on the first call",
        ).toEqual([255, 255, 40, 40]);
        expect(
          [colourOf(opened, cellOf(DOWN)), colourOf(opened, cellOf(UP))],
          "chorus: the octave pads are green",
        ).toEqual([
          [0, 180, 60],
          [0, 180, 60],
        ]);
        expect(
          colourOf(opened, cellOf(6)),
          "chorus: a chord pad is blue or violet, never the octave green",
        ).not.toEqual([0, 180, 60]);

        const shiftPicture = (): [number, number] => [
          phaseOf(opened, cellOf(DOWN)),
          phaseOf(opened, cellOf(UP)),
        ];
        const chordAfter = (label: string, expected: number[]): void => {
          const from = opened.host.midi.length;
          press(opened, 0);
          expect(since(opened, from), label).toEqual(ons(expected));
          lift(opened, 0);
        };
        let from = opened.host.midi.length;
        press(opened, UP);
        lift(opened, UP);
        expect(
          since(opened, from),
          "chorus: an octave pad sends nothing",
        ).toEqual([]);
        expect(shiftPicture(), "chorus: +1 lights the up pad to 140").toEqual([
          40, 140,
        ]);
        chordAfter("chorus: +1 octave", rootOf(60, 0));
        press(opened, UP);
        lift(opened, UP);
        expect(shiftPicture(), "chorus: +2 lights the up pad to 240").toEqual([
          40, 240,
        ]);
        chordAfter("chorus: +2 octaves", rootOf(72, 0));
        from = opened.host.midi.length;
        press(opened, UP);
        lift(opened, UP);
        expect(
          since(opened, from),
          "chorus: a refused press sends nothing",
        ).toEqual([]);
        expect(
          shiftPicture(),
          "chorus: +2 is the end; a third press is refused",
        ).toEqual([40, 240]);
        chordAfter("chorus: still +2 octaves", rootOf(72, 0));
        for (let k = 0; k < 4; k += 1) {
          press(opened, DOWN);
          lift(opened, DOWN);
        }
        expect(
          shiftPicture(),
          "chorus: four presses down from +2 is -2",
        ).toEqual([240, 40]);
        chordAfter("chorus: -2 octaves", rootOf(24, 0));
        press(opened, DOWN);
        lift(opened, DOWN);
        expect(
          shiftPicture(),
          "chorus: -2 is the end; a fifth press down is refused",
        ).toEqual([240, 40]);
        chordAfter("chorus: still -2 octaves", rootOf(24, 0));
        press(opened, UP);
        lift(opened, UP);
        expect(shiftPicture(), "chorus: -1 lights the down pad to 140").toEqual(
          [140, 40],
        );
        press(opened, UP);
        lift(opened, UP);
        expect(shiftPicture(), "chorus: back at 0, both pads at 40").toEqual([
          40, 40,
        ]);

        // The sounding chord keeps its notes across an octave press, and its
        // note-offs are the notes that were sent - `R` reads s.n, never the table.
        from = opened.host.midi.length;
        press(opened, 3, 0);
        press(opened, UP, 1);
        lift(opened, UP, 1);
        expect(
          since(opened, from),
          "chorus: an octave press under a held chord sends nothing",
        ).toEqual(ons(rootOf(48, 3)));
        from = opened.host.midi.length;
        lift(opened, 3, 0);
        expect(
          since(opened, from),
          "chorus: the held chord's note-offs are the notes it sent, not the shifted table",
        ).toEqual(offs(rootOf(48, 3)));
        chordAfter("chorus: the next chord is shifted", rootOf(60, 0));
        for (const m of opened.host.midi)
          expect(
            m.p1,
            "chorus: every note inside 0..127",
          ).toBeGreaterThanOrEqual(0);
        for (const m of opened.host.midi)
          expect(m.p1, "chorus: every note inside 0..127").toBeLessThanOrEqual(
            127,
          );
        report.push(
          "  octave pads: +1 60/64/67, +2 72/76/79, a third press refused, -2 24/28/31, a fifth refused; the up pad's phase 40/140/240, the down pad's mirror; an octave pad sends nothing; a held chord keeps its notes",
        );
        expect(opened.host.errors, opened.host.errors.join(" | ")).toEqual([]);
      } finally {
        opened.host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 3. SMART INVERSION: I then V. Under Off, V is root position (55 59 62).
    //    Under Smart, the five candidates for V against C E G (48 52 55) are the
    //    root 55 59 62 (sum 21), the first inversion above 59 62 67 (33), the
    //    second above 62 67 71 (45), the second an octave down 50 55 59 (9) and
    //    the first an octave down 47 50 55 (3): B2 D3 G3 wins - the G held, the
    //    E and the C each a step down. Back to I from 47 50 55: root 48 52 55
    //    (3), first above 52 55 60 (15), second above 55 60 64 (27), second down
    //    43 48 52 (9), first down 40 43 48 (21): root. Then vi from 48 52 55:
    //    root 57 60 64 (26), first above 60 64 69 (38), second down 52 57 60
    //    (14), first down 48 52 57 (2): C E A. The rule is `d<m or d==m and
    //    k==0`: the least sum, a tie to root position.
    // -----------------------------------------------------------------------
    {
      const off = await openWith({ inversion: 0 });
      const smart = await openWith({ inversion: 1 });
      try {
        for (const [label, opened] of [
          ["Off", off],
          ["Smart", smart],
        ] as const) {
          press(opened, 0);
          expect(
            since(opened, 0),
            `chorus ${label}: a first press of I is root position`,
          ).toEqual(ons([48, 52, 55]));
          lift(opened, 0);
        }
        let from = off.host.midi.length;
        press(off, 4);
        expect(since(off, from), "chorus Off: V is root position").toEqual(
          ons([55, 59, 62]),
        );
        lift(off, 4);
        from = smart.host.midi.length;
        press(smart, 4);
        expect(
          since(smart, from),
          "chorus Smart: V is the closest inversion to C E G - B2 D3 G3",
        ).toEqual(ons([47, 50, 55]));
        from = smart.host.midi.length;
        lift(smart, 4);
        expect(
          since(smart, from),
          "chorus Smart: the note-offs are the voiced notes",
        ).toEqual(offs([47, 50, 55]));
        from = smart.host.midi.length;
        press(smart, 0);
        expect(
          since(smart, from),
          "chorus Smart: back to I from B2 D3 G3 is root position, C3 E3 G3",
        ).toEqual(ons([48, 52, 55]));
        lift(smart, 0);
        from = smart.host.midi.length;
        press(smart, 5);
        expect(
          since(smart, from),
          "chorus Smart: vi after C3 E3 G3 is C3 E3 A3, the first inversion an octave down",
        ).toEqual(ons([48, 52, 57]));
        lift(smart, 5);
        report.push(
          "  Smart: I 48/52/55 -> V 47/50/55 (Off: 55/59/62) -> I 48/52/55 -> vi 48/52/57; the note-offs are the voiced notes",
        );
        expect(off.host.errors, off.host.errors.join(" | ")).toEqual([]);
        expect(smart.host.errors, smart.host.errors.join(" | ")).toEqual([]);
      } finally {
        off.host.close();
        smart.host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 4. THE RANGE under Smart at both ends: every pad at B3 two octaves up and
    //    at C3 two octaves down, in an order that walks the inversions, stays
    //    inside 0..127 - the header's 16..109 by construction.
    // -----------------------------------------------------------------------
    {
      let top = -1;
      let bottom = 128;
      for (const [key, pad, shift] of [
        [11, UP, 2],
        [0, DOWN, -2],
      ] as const) {
        const opened = await openWith({ key, inversion: 1 });
        try {
          for (let k = 0; k < Math.abs(shift); k += 1) {
            press(opened, pad);
            lift(opened, pad);
          }
          for (const z of [0, 6, 1, 5, 2, 4, 3, 6, 0]) {
            press(opened, z);
            lift(opened, z);
          }
          for (const m of opened.host.midi) {
            top = Math.max(top, m.p1);
            bottom = Math.min(bottom, m.p1);
          }
          expect(opened.host.errors, opened.host.errors.join(" | ")).toEqual(
            [],
          );
        } finally {
          opened.host.close();
        }
      }
      expect(top, "chorus: the highest note ever sent").toBeLessThanOrEqual(
        109,
      );
      expect(
        bottom,
        "chorus: the lowest note ever sent",
      ).toBeGreaterThanOrEqual(16);
      report.push(
        `  range under Smart at the ends: ${bottom}..${top} (0..127 holds)`,
      );
    }

    process.stdout.write(
      "\nCHORUS, the lowest chord bottom-left, octave pads, Smart inversion (change 7, 2026-09-18):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length, "every stage of the chorus probe ran").toBe(4);
  }, 120000);

  it("runs ORBIT: four rings step and send their own notes from the Timer under Internal with 32 steps on the outer ring and each ring's colour on its cells, External ignores the Timer's tempo and steps every Division clocks from Start, Stop halts, Continue resumes, active sensing does nothing, the preview holds Internal, and the note field reads C#3 and 49 alike", async () => {
    // CHANGE 8 (2026-09-18, BENCH-2026-09-16.txt section 8). The host has no
    // MIDI input, so the DAW's realtime bytes are driven straight at the
    // configuration's `rtmrx_cb` through `host.rtm(byte)` - the same call
    // `decode.lua:42-44` makes - and the routing gate the firmware applies
    // first (`grid_decode.c:388`, `rx_mode`) is read off `host.rxMode`.
    const entry = entryById("orbit");
    const notes = [1, 2, 3, 4].map((d) => knobValueOf(entry, `note${d}`));
    const channel = knobValueOf(entry, "channel");
    const pulsesKnob = entry.knobs.find((knob) => knob.id === "pulses");
    const tempoKnob = entry.knobs.find((knob) => knob.id === "tempo");
    const syncKnob = entry.knobs.find((knob) => knob.id === "sync");
    const divisionKnob = entry.knobs.find((knob) => knob.id === "division");
    if (!pulsesKnob || !tempoKnob || !syncKnob || !divisionKnob)
      throw new Error("orbit: pulses, tempo, sync and division knobs expected");
    const pulses = pulsesKnob.values[entry.defaults.pulses]
      .split(",")
      .map(Number);
    expect(notes, "orbit: the GM drum map inner to outer").toEqual([
      36, 38, 42, 46,
    ]);
    expect(
      tempoKnob.values.map(Number),
      "orbit: the tempo rail is BPM, ascending - the bigger number is the faster step (change 8b)",
    ).toEqual([60, 90, 110, 136, 160, 200]);
    expect(
      Math.floor(15000 / knobValueOf(entry, "tempo")),
      "orbit: the default 136 BPM is exactly the 110 ms 16th EUCLID had",
    ).toBe(110);
    expect(pulses, "orbit: four pulse counts").toHaveLength(4);
    /** Ring d's length in steps: the four concentric squares hold 8, 16, 24, 32 cells. */
    const lengthOf = (d: number): number => d * 8;
    /** The Euclidean test the Setup bakes: is step t of ring d a pulse. */
    const pulseAt = (d: number, t: number): boolean => {
      const n = lengthOf(d);
      const h = pulses[d - 1];
      return Math.floor((t * h) / n) !== Math.floor(((t - 1) * h) / n);
    };
    /** The cells of ring d, in the Setup's own order: (d, t%(2d)-d) turned a quarter t//(2d) times. */
    const cellsOf = (d: number): number[] => {
      const out: number[] = [];
      for (let t = 0; t < lengthOf(d); t += 1) {
        let a = d;
        let b = (t % (d * 2)) - d;
        for (let j = 0; j < Math.floor(t / (d * 2)); j += 1) {
          const na = -b;
          b = a;
          a = na;
        }
        out.push(a + 4 + (b + 4) * 9);
      }
      return out;
    };
    for (let d = 1; d <= 4; d += 1) {
      const cells = cellsOf(d);
      expect(
        new Set(cells).size,
        `ring ${d}: ${lengthOf(d)} distinct cells`,
      ).toBe(lengthOf(d));
      for (const cell of cells)
        expect(
          ringOf(cell),
          `ring ${d}: cell ${cell} at Chebyshev distance ${d}`,
        ).toBe(d);
    }
    expect(
      cellsOf(4),
      "the outer ring is the outermost square, 32 cells",
    ).toHaveLength(32);

    async function openWith(over: Record<string, number>) {
      const { setup, timer } = renderLua(entry, { ...entry.defaults, ...over });
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer,
      });
      return { host, sim };
    }
    type Opened = Awaited<ReturnType<typeof openWith>>;
    /** The Timer's period in ticks at the default tempo: a 16th at 136 BPM is 15000//136 = 110 ms, 11 ticks. */
    const PERIOD = Math.floor(15000 / knobValueOf(entry, "tempo")) / 10;
    const since = ({ host }: Opened, from: number): string[] =>
      host.midi.slice(from).map((m) => `${m.ch}:${m.cmd}:${m.p1}:${m.p2}`);
    const stepOf = ({ host }: Opened): number => host.selfNumber("k") ?? -1;
    const clocksOf = ({ host }: Opened): number => host.selfNumber("q") ?? -1;
    const CLOCK = 248;
    const START = 250;
    const CONTINUE = 251;
    const STOP = 252;
    const SENSING = 254;
    const report: string[] = [];

    // -----------------------------------------------------------------------
    // 1. INTERNAL: the Timer steps every ring, the notes are each ring's own.
    {
      const run = await openWith({});
      const { host, sim } = run;
      try {
        expect(host.errors, "orbit: the Setup raised").toEqual([]);
        expect(
          host.rxMode,
          "Internal asks grxm(2,0): MIDIRTM stays unrouted",
        ).toBe(0);
        expect(
          host.midi,
          "nothing is sent before the first Timer call",
        ).toHaveLength(0);
        host.run(PERIOD + 1);
        // Step 0 is a pulse on every ring (t*h//n is 0 and (t-1)*h//n is -1), so
        // the first call sends four note-offs and four note-ons, inner to outer.
        expect(
          since(run, 0),
          "the first step: an off then an on per ring, on the ring's note",
        ).toEqual(
          [1, 2, 3, 4].flatMap((d) => [
            `${channel}:128:${notes[d - 1]}:0`,
            `${channel}:144:${notes[d - 1]}:100`,
          ]),
        );
        // A whole 96-step cycle: every ring's note-ons are exactly its pulses
        // times its cycles, so the outer ring proves its 32 steps by count.
        const mark = host.midi.length;
        host.run(PERIOD * 95);
        expect(stepOf(run), "96 steps wrap to 0").toBe(0);
        const ons = host.midi.slice(mark).filter((m) => m.cmd === 144);
        for (let d = 1; d <= 4; d += 1) {
          const own = ons.filter((m) => m.p1 === notes[d - 1]).length;
          const expected = pulses[d - 1] * (96 / lengthOf(d)) - 1;
          expect(
            own,
            `ring ${d}: ${pulses[d - 1]} pulses over ${lengthOf(d)} steps, ${96 / lengthOf(d)} cycles in 96 steps (step 0 already counted)`,
          ).toBe(expected);
        }
        expect(
          host.midi.filter((m) => m.cmd === 128).length,
          "one note-off per ring per step",
        ).toBe(96 * 4);
        // The outer ring's on-steps are the Euclidean pattern over 32, read off
        // the calls: step t of ring 4 is call t within its cycle.
        const offsOf4 = host.midi
          .map((m, at) => ({ m, at }))
          .filter(({ m }) => m.cmd === 128 && m.p1 === notes[3]);
        const onSteps = offsOf4
          .map(({ at }, t) =>
            host.midi[at + 1]?.cmd === 144 && host.midi[at + 1]?.p1 === notes[3]
              ? t % 32
              : -1,
          )
          .filter((t) => t >= 0);
        const expectedOn = Array.from({ length: 32 }, (_, t) => t).filter((t) =>
          pulseAt(4, t),
        );
        expect(
          [...new Set(onSteps)].sort((a, b) => a - b),
          "the outer ring's pulses over 32 steps",
        ).toEqual(expectedOn);
        // Every ring cell carries its ring's colour on layer 2 after one cycle.
        for (let d = 1; d <= 4; d += 1) {
          const colour = entry.knobs
            .find((knob) => knob.id === `ring${d}Colour`)!
            .values[entry.defaults[`ring${d}Colour`]].split(",")
            .map(Number);
          for (const cell of cellsOf(d)) {
            expect(
              [...sim.layer(hwOfCell(cell), 2).max],
              `ring ${d}: cell ${cell} carries its ring's colour on layer 2`,
            ).toEqual(colour);
          }
        }
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        report.push(
          `  Internal: 96 steps in ${PERIOD * 96} ticks, note-ons per ring ${[
            1, 2, 3, 4,
          ]
            .map((d) => ons.filter((m) => m.p1 === notes[d - 1]).length + 1)
            .join("/")}, outer-ring pulses at steps ${expectedOn.join(" ")}`,
        );
      } finally {
        host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 2. EXTERNAL: the Timer steps nothing; the clock does, every Division.
    {
      const run = await openWith({ sync: 1 });
      const { host } = run;
      try {
        expect(
          host.rxMode,
          "External asks grxm(2,3): MIDIRTM routed to Lua",
        ).toBe(3);
        host.run(PERIOD * 3);
        expect(
          host.midi,
          "the Timer sends nothing under External",
        ).toHaveLength(0);
        expect(stepOf(run), "the Timer steps nothing under External").toBe(0);
        // Clocks before Start do nothing: the rings wait for the DAW's play.
        for (let n = 0; n < 12; n += 1)
          expect(host.rtm(CLOCK), "the handler exists").toBe(true);
        expect(stepOf(run), "clocks before Start step nothing").toBe(0);
        expect(host.midi, "clocks before Start send nothing").toHaveLength(0);
        // Start, then the first clock lands step 0; the 16th is six clocks.
        host.rtm(START);
        expect(clocksOf(run), "Start resets the clock count").toBe(0);
        host.rtm(CLOCK);
        expect(since(run, 0), "the first clock after Start is step 0").toEqual(
          [1, 2, 3, 4].flatMap((d) => [
            `${channel}:128:${notes[d - 1]}:0`,
            `${channel}:144:${notes[d - 1]}:100`,
          ]),
        );
        expect(stepOf(run)).toBe(1);
        for (let n = 0; n < 5; n += 1) host.rtm(CLOCK);
        expect(
          stepOf(run),
          "five more clocks: still inside the first 16th",
        ).toBe(1);
        host.rtm(CLOCK);
        expect(stepOf(run), "the seventh clock is the second step").toBe(2);
        // The Timer's tempo is ignored: two hundred ticks move no step.
        const before = host.midi.length;
        host.run(200);
        expect(stepOf(run), "the Timer does not step under External").toBe(2);
        expect(host.midi.length, "nor send").toBe(before);
        // Stop halts; clocks and active sensing after it do nothing.
        host.rtm(STOP);
        for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
        host.rtm(SENSING);
        for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
        expect(stepOf(run), "Stop halts the rings").toBe(2);
        expect(host.midi.length, "nothing sent while stopped").toBe(before);
        // Continue resumes where it was: the count goes on from 7.
        host.rtm(CONTINUE);
        expect(clocksOf(run), "Continue keeps the clock count").toBe(7);
        for (let n = 0; n < 5; n += 1) host.rtm(CLOCK);
        expect(
          stepOf(run),
          "five clocks on: the count is 12, not yet stepped",
        ).toBe(2);
        host.rtm(CLOCK);
        expect(stepOf(run), "the clock at count twelve is the third step").toBe(
          3,
        );
        // Start again resets to step 0 and runs.
        host.rtm(START);
        host.rtm(CLOCK);
        expect(
          stepOf(run),
          "Start resets to step 0, and the clock lands it",
        ).toBe(1);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        report.push(
          `  External at the 16th: step 0 on the first clock after Start, step 1 on the seventh; 200 Timer ticks moved nothing; Stop held it; Continue went on from clock 7; Start reset it`,
        );
      } finally {
        host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 3. THE DIVISION: an 8th is twelve clocks, a 32nd three; and a clock that
    //    arrives before the Timer has published the step routine is counted,
    //    not stepped (the one-period caveat the entry's header states).
    for (const [index, clocks] of [
      [0, 12],
      [2, 3],
    ] as const) {
      const run = await openWith({ sync: 1, division: index });
      const { host } = run;
      try {
        host.rtm(START);
        host.rtm(CLOCK);
        expect(
          stepOf(run),
          `division ${divisionKnob.values[index]}: a clock before the first Timer call is counted, not stepped`,
        ).toBe(0);
        expect(clocksOf(run)).toBe(1);
        host.run(PERIOD + 1);
        // The lost step 0 costs nothing in phase: the step routine is published now, and the
        // clock whose count is a multiple of the division lands the step it always would have.
        for (let n = 0; n < clocks; n += 1) host.rtm(CLOCK);
        expect(
          stepOf(run),
          `division ${divisionKnob.values[index]}: clock ${clocks + 1} after Start is step 1`,
        ).toBe(1);
        for (let n = 0; n < clocks; n += 1) host.rtm(CLOCK);
        expect(
          stepOf(run),
          `division ${divisionKnob.values[index]}: ${clocks} more clocks, one more step`,
        ).toBe(2);
        report.push(
          `  Division ${divisionKnob.values[index]} clocks a step: steps at clocks ${clocks + 1} and ${clocks * 2 + 1} after Start (the first clock arrived before the Timer published the routine: counted, not stepped)`,
        );
      } finally {
        host.close();
      }
    }

    // -----------------------------------------------------------------------
    // 4. THE WORDS, THE PREVIEW AND THE NOTE FIELD.
    expect(
      syncKnob.values.map((literal) =>
        wordFor(syncKnob.kind, literal, syncKnob.id),
      ),
      "Sync reads Internal / External",
    ).toEqual(["Internal", "External"]);
    expect(widgetFor(syncKnob.kind, syncKnob.values, syncKnob.id)).toBe(
      "words",
    );
    expect(
      divisionKnob.values.map((literal) => wordFor(divisionKnob.kind, literal)),
      "Division reads 8th / 16th / 32nd",
    ).toEqual(["8th", "16th", "32nd"]);
    expect(widgetFor(divisionKnob.kind, divisionKnob.values)).toBe("words");
    expect(
      previewIndices(entry, { ...entry.defaults, sync: 1 })?.sync,
      "the preview renders Internal whatever Sync says (no clock reaches a browser)",
    ).toBe(0);
    expect(
      previewIndices(entry, entry.defaults)?.tempo,
      "every other index is the visitor's",
    ).toBe(entry.defaults.tempo);
    for (const d of [1, 2, 3, 4]) {
      const knob = entry.knobs.find(
        (candidate) => candidate.id === `note${d}`,
      )!;
      expect(knob.values, `note${d}: every MIDI note`).toHaveLength(128);
      expect(
        wordFor("note", knob.values[knob.default]),
        `note${d}: the readout is the name`,
      ).toBe(noteName(notes[d - 1]));
    }
    expect(noteNumber("C#3"), "C#3 is 49").toBe(49);
    expect(noteNumber("49"), "49 is 49").toBe(49);
    expect(noteNumber(" db3 "), "a flat, lower case, padded").toBe(49);
    expect(
      noteNumber("C-1"),
      "the bottom of the range, in noteName's spelling (C4 = 60)",
    ).toBe(0);
    expect(noteNumber("G9"), "the top of the range").toBe(127);
    expect(noteNumber("128"), "128 is refused").toBeUndefined();
    expect(noteNumber("H3"), "H3 is refused").toBeUndefined();
    expect(noteNumber("G#9"), "G#9 is past 127").toBeUndefined();
    expect(noteNumber("-1"), "-1 is refused").toBeUndefined();
    expect(noteName(49), "and back").toBe("C#3");

    process.stdout.write(
      "\nORBIT, four rings, a colour and a note each, Internal or the DAW's clock (change 8, 2026-09-18):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length, "every stage of the orbit probe ran").toBe(4);
  }, 120000);

  // -------------------------------------------------------------------------
  // CHANGE 12 (2026-09-18, BENCH-2026-09-16.txt section 12): ORBIT's clock
  // idiom on STEPS, RADAR POINTS and GHOST, bench-verified on ORBIT the same
  // day. The same harness: the DAW's realtime bytes are driven straight at
  // `rtmrx_cb` through `host.rtm(byte)`, the routing gate read off `rxMode`.
  // Internal is the existing tests' business (every one above is untouched
  // and green, and frames.spec.ts holds the rest frame); these three prove
  // External: the Timer moves nothing, Start resets and releases, a step every
  // Division clocks, Stop halts and releases, Continue resumes.
  // -------------------------------------------------------------------------

  const CLOCK = 248;
  const START = 250;
  const CONTINUE = 251;
  const STOP = 252;
  const SENSING = 254;

  /** One entry opened at its defaults with some indices overridden, on the real library. */
  async function openSynced(entry: CatalogEntry, over: Record<string, number>) {
    const { setup, timer } = renderLua(entry, { ...entry.defaults, ...over });
    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup,
      timer,
    });
    return { host, sim };
  }

  const wire = (midi: readonly HostMidi[], from: number): string[] =>
    midi.slice(from).map((m) => `${m.ch}:${m.cmd}:${m.p1}:${m.p2}`);

  it("runs STEPS on the DAW's clock: External moves no column from the Timer, Start releases the sounding column and lands column 0 on the first clock, a column every Division clocks, Stop halts and releases, Continue resumes, the BPM rail is today's five periods, and the preview holds Internal", async () => {
    const entry = entryById("steps");
    const note = knobValueOf(entry, "note");
    const channel = knobValueOf(entry, "channel");
    const tempoKnob = entry.knobs.find((knob) => knob.id === "tempo");
    const syncKnob = entry.knobs.find((knob) => knob.id === "sync");
    const divisionKnob = entry.knobs.find((knob) => knob.id === "division");
    if (!tempoKnob || !syncKnob || !divisionKnob)
      throw new Error("steps: tempo, sync and division knobs expected");
    // The rail reads BPM ascending and a column is a 16th: 15000//@BPM is
    // exactly the five millisecond periods the card had, 125 the 120 ms default.
    expect(tempoKnob.values.map(Number)).toEqual([75, 100, 125, 166, 250]);
    expect(
      tempoKnob.values.map((v) => Math.floor(15000 / Number(v))),
      "steps: the BPM rail reproduces today's five periods",
    ).toEqual([200, 150, 120, 90, 60]);
    /** The Timer's period in ticks at the default: a 16th at 125 BPM is 120 ms, 12 ticks. */
    const PERIOD = Math.floor(15000 / knobValueOf(entry, "tempo")) / 10;
    expect(PERIOD).toBe(12);
    // The default pattern: the bottom row on every second column, so the only
    // note is @NOTE+7 and it sounds on columns 0, 2, 4 and 6.
    const kick = note + 7;
    const ON = `${channel}:144:${kick}:100`;
    const OFF = `${channel}:128:${kick}:0`;
    const report: string[] = [];

    // 1. INTERNAL, as a baseline for the wire below: eight steps are four
    //    note-ons and four note-offs of the one armed row, in order.
    {
      const { host } = await openSynced(entry, {});
      try {
        expect(host.rxMode, "Internal asks grxm(2,0)").toBe(0);
        host.run(PERIOD * 8 + 1);
        expect(host.selfNumber("k"), "eight columns advanced").toBe(8);
        expect(
          wire(host.midi, 0),
          "internal: on 0, off 0 at 1, on 2 ...",
        ).toEqual([ON, OFF, ON, OFF, ON, OFF, ON, OFF]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // 2. EXTERNAL at the 16th.
    {
      const { host } = await openSynced(entry, { sync: 1 });
      try {
        expect(host.rxMode, "External asks grxm(2,3)").toBe(3);
        host.run(PERIOD * 3);
        expect(
          host.midi,
          "the Timer sends nothing under External",
        ).toHaveLength(0);
        expect(host.selfNumber("k"), "the Timer advances no column").toBe(0);
        for (let n = 0; n < 12; n += 1)
          expect(host.rtm(CLOCK), "the handler exists").toBe(true);
        expect(host.midi, "clocks before Start send nothing").toHaveLength(0);
        host.rtm(START);
        expect(host.selfNumber("q"), "Start resets the count").toBe(0);
        host.rtm(CLOCK);
        expect(
          wire(host.midi, 0),
          "the first clock after Start is column 0",
        ).toEqual([ON]);
        expect(host.selfNumber("k")).toBe(1);
        for (let n = 0; n < 5; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), "five more clocks: inside the 16th").toBe(
          1,
        );
        host.rtm(CLOCK);
        expect(host.selfNumber("k"), "the seventh clock is column 1").toBe(2);
        expect(
          wire(host.midi, 1),
          "column 1 releases column 0's row and arms nothing",
        ).toEqual([OFF]);
        // The Timer's tempo is ignored: two hundred ticks move no column.
        const before = host.midi.length;
        host.run(200);
        expect(
          host.selfNumber("k"),
          "the Timer does not step under External",
        ).toBe(2);
        expect(host.midi.length, "nor send").toBe(before);
        // Step on to column 2 (armed), then Stop: the sounding column is
        // released so nothing hangs, and clocks after it do nothing.
        for (let n = 0; n < 6; n += 1) host.rtm(CLOCK);
        expect(wire(host.midi, before), "column 2 sounds").toEqual([ON]);
        host.rtm(STOP);
        expect(
          wire(host.midi, before + 1),
          "Stop releases column 2's row",
        ).toEqual([OFF]);
        const stopped = host.midi.length;
        for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
        host.rtm(SENSING);
        for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), "Stop halts the sweep").toBe(3);
        expect(host.midi.length, "nothing sent while stopped").toBe(stopped);
        // Continue keeps the count (13 after three steps); the clock that
        // finds the count at 18 lands column 3, the sixth from here.
        host.rtm(CONTINUE);
        expect(host.selfNumber("q"), "Continue keeps the clock count").toBe(13);
        for (let n = 0; n < 5; n += 1) host.rtm(CLOCK);
        expect(
          host.selfNumber("k"),
          "five clocks on: count 18, not yet stepped",
        ).toBe(3);
        host.rtm(CLOCK);
        expect(
          host.selfNumber("k"),
          "the clock at count eighteen is column 3",
        ).toBe(4);
        expect(
          wire(host.midi, stopped),
          "column 3 releases column 2 again (already off) and arms nothing",
        ).toEqual([OFF]);
        // Start again: release the sounding column, reset, and land column 0.
        host.rtm(START);
        expect(host.selfNumber("k"), "Start resets the column").toBe(0);
        host.rtm(CLOCK);
        expect(
          wire(host.midi, stopped + 1),
          "Start's release of column 3 (nothing armed) then column 0",
        ).toEqual([ON]);
        expect(host.selfNumber("k")).toBe(1);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        report.push(
          "  External at the 16th: column 0 on the first clock after Start, column 1 on the seventh; 200 Timer ticks moved nothing; Stop released the sounding row; Continue went on from clock 13; Start reset it",
        );
      } finally {
        host.close();
      }
    }

    // 3. THE DIVISION, and the one-period caveat: a clock before the Timer's
    //    first call is counted, not stepped (`s.f` is not yet published).
    for (const [index, clocks] of [
      [0, 12],
      [2, 3],
    ] as const) {
      const { host } = await openSynced(entry, { sync: 1, division: index });
      try {
        host.rtm(START);
        host.rtm(CLOCK);
        expect(
          host.selfNumber("k"),
          `division ${divisionKnob.values[index]}: counted, not stepped`,
        ).toBe(0);
        expect(host.selfNumber("q")).toBe(1);
        host.run(PERIOD + 1);
        for (let n = 0; n < clocks; n += 1) host.rtm(CLOCK);
        expect(
          host.selfNumber("k"),
          `division ${divisionKnob.values[index]}: clock ${clocks + 1} is column 1`,
        ).toBe(1);
        for (let n = 0; n < clocks; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k")).toBe(2);
        report.push(
          `  Division ${divisionKnob.values[index]} clocks a column: columns at clocks ${clocks + 1} and ${clocks * 2 + 1} after Start`,
        );
      } finally {
        host.close();
      }
    }

    // 4. THE WORDS AND THE PREVIEW.
    expect(
      syncKnob.values.map((literal) =>
        wordFor(syncKnob.kind, literal, syncKnob.id),
      ),
    ).toEqual(["Internal", "External"]);
    expect(widgetFor(syncKnob.kind, syncKnob.values, syncKnob.id)).toBe(
      "words",
    );
    expect(
      divisionKnob.values.map((literal) => wordFor(divisionKnob.kind, literal)),
    ).toEqual(["8th", "16th", "32nd"]);
    expect(widgetFor(divisionKnob.kind, divisionKnob.values)).toBe("words");
    expect(
      previewIndices(entry, { ...entry.defaults, sync: 1 })?.sync,
      "the preview renders Internal whatever Sync says",
    ).toBe(0);
    process.stdout.write(
      "\nSTEPS on the DAW's clock (change 12, 2026-09-18):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length).toBe(3);
  }, 120000);

  it("runs RADAR POINTS on the DAW's clock: External rolls no ring from the Timer, Start releases the pending list and lands ring 0 on the first clock, a ring every Division clocks with the three quiet steps kept, Stop halts and releases, Continue resumes, and the preview holds Internal", async () => {
    const entry = entryById("radar-points");
    const channel = knobValueOf(entry, "channel");
    const root = knobValueOf(entry, "root");
    const syncKnob = entry.knobs.find((knob) => knob.id === "sync");
    const divisionKnob = entry.knobs.find((knob) => knob.id === "division");
    if (!syncKnob || !divisionKnob)
      throw new Error("radar-points: sync and division knobs expected");
    const scaleKnob = entry.knobs.find((knob) => knob.id === "scale");
    if (!scaleKnob) throw new Error("radar-points: scale knob expected");
    const scale = scaleKnob.values[entry.defaults.scale].split(",").map(Number);
    /** The Setup's own pitch map, ported: the compass bucket walks the scale and wraps an octave. */
    const pitchOf = (cell: number): number => {
      const y = Math.floor(cell / 9) - 4;
      const x = (cell % 9) - 4;
      const a = Math.floor(Math.atan2(y, x) * 41) + 16;
      const b = Math.floor((((a % 256) + 256) % 256) / 32);
      return root + scale[b % scale.length] + 12 * Math.floor(b / scale.length);
    };
    const PERIOD = knobValueOf(entry, "sweep") / 10;
    // Two points on two rings in two directions: ring 1 east, ring 2 north-east.
    const P1 = 41;
    const P2 = 24;
    expect([ringOf(P1), ringOf(P2)]).toEqual([1, 2]);
    const on = (cell: number) => `${channel}:144:${pitchOf(cell)}:100`;
    const off = (cell: number) => `${channel}:128:${pitchOf(cell)}:0`;
    const report: string[] = [];

    const { host, sim } = await openSynced(entry, { sync: 1 });
    try {
      expect(host.rxMode, "External asks grxm(2,3)").toBe(3);
      const litOnRing = (ring: number): number => {
        let n = 0;
        for (let cell = 0; cell < 81; cell += 1)
          if (ringOf(cell) === ring && sim.layer(hwOfCell(cell), 2).pha > 0)
            n += 1;
        return n;
      };
      // Arm the two points; the Timer runs at @PERIOD for the finger sweep
      // and the touch queue, and publishes the step, but rolls no ring.
      for (const cell of [P1, P2]) {
        const x = ledCentre(cell % 9, "x");
        const y = ledCentre(Math.floor(cell / 9), "y");
        host.touchDown(0, x, y);
        host.run(1);
        host.touchUp(0, x, y);
        host.run(1);
        expect(sim.layer(hwOfCell(cell), 1).pha, `cell ${cell} armed`).toBe(
          255,
        );
      }
      host.run(PERIOD * 16);
      expect(host.midi, "the Timer sends nothing under External").toHaveLength(
        0,
      );
      expect(host.selfNumber("k"), "the Timer rolls no ring").toBeUndefined();
      expect(litOnRing(1) + litOnRing(2), "no ring is lit").toBe(0);
      for (let n = 0; n < 12; n += 1)
        expect(host.rtm(CLOCK), "the handler exists").toBe(true);
      expect(host.midi, "clocks before Start send nothing").toHaveLength(0);
      // Start; the first clock is ring 0 (the centre alone, no point there),
      // the seventh ring 1, the thirteenth ring 2.
      host.rtm(START);
      expect(host.selfNumber("k"), "Start resets the ring").toBe(0);
      host.rtm(CLOCK);
      expect(
        host.selfNumber("k"),
        "the first clock after Start is ring 0",
      ).toBe(1);
      expect(host.midi, "ring 0 carries no point").toHaveLength(0);
      for (let n = 0; n < 6; n += 1) host.rtm(CLOCK);
      expect(host.selfNumber("k"), "the seventh clock is ring 1").toBe(2);
      expect(wire(host.midi, 0), "ring 1 sounds its point").toEqual([on(P1)]);
      expect(litOnRing(1), "all eight ring-1 cells lit on the wave layer").toBe(
        8,
      );
      expect(litOnRing(4), "no ring-4 cell lit").toBe(0);
      for (let n = 0; n < 6; n += 1) host.rtm(CLOCK);
      expect(
        wire(host.midi, 1),
        "ring 2 releases ring 1's point and sounds its own",
      ).toEqual([off(P1), on(P2)]);
      // The Timer's period is ignored: two hundred ticks roll no ring.
      const before = host.midi.length;
      host.run(200);
      expect(
        host.selfNumber("k"),
        "the Timer does not step under External",
      ).toBe(3);
      expect(host.midi.length, "nor send").toBe(before);
      // Stop releases the pending list; clocks and active sensing do nothing.
      host.rtm(STOP);
      expect(wire(host.midi, before), "Stop releases ring 2's point").toEqual([
        off(P2),
      ]);
      const stopped = host.midi.length;
      for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
      host.rtm(SENSING);
      for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
      expect(host.selfNumber("k"), "Stop halts the ping").toBe(3);
      expect(host.midi.length, "nothing sent while stopped").toBe(stopped);
      // Continue goes on from clock 13: the sixth clock finds the count at 18
      // and lands ring 3 (no point, and the list is already empty so nothing
      // is released twice).
      host.rtm(CONTINUE);
      expect(host.selfNumber("q"), "Continue keeps the clock count").toBe(13);
      for (let n = 0; n < 5; n += 1) host.rtm(CLOCK);
      expect(host.selfNumber("k"), "five clocks on: not yet stepped").toBe(3);
      host.rtm(CLOCK);
      expect(host.selfNumber("k"), "ring 3").toBe(4);
      expect(
        host.midi.length,
        "ring 3 sends nothing and releases nothing twice",
      ).toBe(stopped);
      // The three quiet steps: rings 4, 5, 6, 7 are steps 4..7; only ring 4
      // can light anything, and the cycle is eight steps before ring 0 again.
      for (let n = 0; n < 6 * 4; n += 1) host.rtm(CLOCK);
      expect(host.selfNumber("k"), "eight steps wrap to ring 0 again").toBe(8);
      expect(host.midi.length, "steps 4..7 sound nothing").toBe(stopped);
      for (let n = 0; n < 6 * 2; n += 1) host.rtm(CLOCK);
      expect(
        wire(host.midi, stopped),
        "the next pass sounds ring 1 again",
      ).toEqual([on(P1)]);
      // Start again: release, reset, ring 0 on the clock.
      host.rtm(START);
      expect(
        wire(host.midi, stopped + 1),
        "Start releases ring 1's point",
      ).toEqual([off(P1)]);
      host.rtm(CLOCK);
      expect(
        host.selfNumber("k"),
        "Start resets to ring 0, and the clock lands it",
      ).toBe(1);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      report.push(
        "  External at the 16th: ring 0 on the first clock after Start, ring 1 on the seventh with all eight cells lit, ring 2 on the thirteenth; 200 Timer ticks moved nothing; Stop released the pending point; Continue went on from clock 13; the eight-step cycle held; Start reset it",
      );
    } finally {
      host.close();
    }

    // The division: an 8th is twelve clocks a ring, and a clock before the
    // Timer's first call is counted, not stepped.
    {
      const { host } = await openSynced(entry, { sync: 1, division: 0 });
      try {
        host.rtm(START);
        host.rtm(CLOCK);
        expect(host.selfNumber("k"), "counted, not stepped").toBe(0);
        host.run(PERIOD + 1);
        for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), "clock 13 after Start is ring 1").toBe(1);
        for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k")).toBe(2);
        report.push(
          "  Division 12 clocks a ring: rings at clocks 13 and 25 after Start",
        );
      } finally {
        host.close();
      }
    }
    expect(
      syncKnob.values.map((literal) =>
        wordFor(syncKnob.kind, literal, syncKnob.id),
      ),
    ).toEqual(["Internal", "External"]);
    expect(
      divisionKnob.values.map((literal) => wordFor(divisionKnob.kind, literal)),
    ).toEqual(["8th", "16th", "32nd"]);
    expect(previewIndices(entry, { ...entry.defaults, sync: 1 })?.sync).toBe(0);
    process.stdout.write(
      "\nRADAR POINTS on the DAW's clock (change 12, 2026-09-18):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length).toBe(2);
  }, 120000);

  it("runs GHOST on the DAW's clock: recording stays real-time on the Timer, External replays nothing from the Timer, Start restarts the loop and each clock replays one recorded point on the wire and the LED, Division stretches it, Stop freezes it, Continue resumes, and the preview holds Internal", async () => {
    const entry = entryById("ghost");
    const cc = knobValueOf(entry, "cc");
    const channel = knobValueOf(entry, "channel");
    const syncKnob = entry.knobs.find((knob) => knob.id === "sync");
    const divisionKnob = entry.knobs.find((knob) => knob.id === "division");
    if (!syncKnob || !divisionKnob)
      throw new Error("ghost: sync and division knobs expected");
    const PATH_COLUMNS = [1, 4, 7] as const;
    const PATH_ROW = 3;
    const pathX = PATH_COLUMNS.map((column) => ledCentre(column, "x"));
    const pathY = ledCentre(PATH_ROW, "y");
    const pathCells = PATH_COLUMNS.map((column) => column + PATH_ROW * 9);
    const xsOf = (midi: readonly HostMidi[], from: number): number[] =>
      midi
        .slice(from)
        .filter((m) => m.p1 === cc)
        .map((m) => m.p2);
    const report: string[] = [];

    /** Draw the three-cell path with the finger held six ticks a cell; returns the recording's length. */
    const draw = (
      host: Awaited<ReturnType<typeof openSynced>>["host"],
    ): number => {
      host.touchDown(0, pathX[0], pathY);
      host.run(6);
      host.touchMove(0, pathX[1], pathY);
      host.run(6);
      host.touchMove(0, pathX[2], pathY);
      host.run(6);
      host.touchUp(0, pathX[2], pathY);
      host.run(2);
      return host.selfNumber("n") ?? 0;
    };

    // 1. EXTERNAL, one point a clock.
    {
      const { host, sim } = await openSynced(entry, { sync: 1 });
      try {
        expect(host.rxMode, "External asks grxm(2,3)").toBe(3);
        const n = draw(host);
        // The Timer is 20 ms - every second tick - so eighteen held ticks are
        // nine or ten points, three a cell.
        expect(
          n,
          "the drag was recorded in real time on the Timer",
        ).toBeGreaterThanOrEqual(6);
        const recorded = xsOf(host.midi, 0);
        expect(
          [...new Set(recorded)].sort((a, b) => a - b),
          "recording sends the pair live under External too",
        ).toEqual([...pathX].sort((a, b) => a - b));
        expect(
          host.midi.filter((m) => m.ch === channel && m.p1 === cc + 1).length,
          "the Y half went with every X",
        ).toBe(recorded.length);
        // The lift: the Timer replays nothing under External.
        const after = host.midi.length;
        host.run(200);
        expect(
          host.midi.length,
          "the Timer replays nothing under External",
        ).toBe(after);
        expect(host.selfNumber("j"), "the replay index waits at 0").toBe(0);
        for (const cell of pathCells)
          expect(
            sim.layer(hwOfCell(cell), 2).pha,
            `cell ${cell}: no ghost yet`,
          ).toBe(0);
        for (let k = 0; k < 12; k += 1)
          expect(host.rtm(CLOCK), "the handler exists").toBe(true);
        expect(host.midi.length, "clocks before Start replay nothing").toBe(
          after,
        );
        // Start: the loop restarts at the first point; a clock a point.
        host.rtm(START);
        expect(host.selfNumber("j")).toBe(0);
        host.rtm(CLOCK);
        expect(host.selfNumber("j"), "the first clock replays point 1").toBe(1);
        expect(
          wire(host.midi, after),
          "point 1 is the down's raw pair",
        ).toEqual([
          `${channel}:176:${cc}:${pathX[0]}`,
          `${channel}:176:${cc + 1}:${127 - pathY}`,
        ]);
        expect(
          sim.layer(hwOfCell(pathCells[0]), 2).pha,
          "the ghost lights the point's LED on layer 2 at the decay's start",
        ).toBe(252);
        for (let k = 1; k < n; k += 1) host.rtm(CLOCK);
        expect(host.selfNumber("j"), "n clocks replay the whole loop").toBe(n);
        expect(
          [...new Set(xsOf(host.midi, after))].sort((a, b) => a - b),
          "one lap replays exactly the recorded x coordinates",
        ).toEqual([...pathX].sort((a, b) => a - b));
        expect(xsOf(host.midi, after).length, "one point per clock").toBe(n);
        host.rtm(CLOCK);
        expect(host.selfNumber("j"), "the loop wraps").toBe(1);
        // The Timer still replays nothing while the clock runs the ghost.
        const mid = host.midi.length;
        host.run(200);
        expect(host.midi.length, "200 Timer ticks send nothing").toBe(mid);
        expect(host.selfNumber("j")).toBe(1);
        // Stop freezes; sensing and clocks do nothing; the key still pulses.
        host.rtm(STOP);
        for (let k = 0; k < 12; k += 1) host.rtm(CLOCK);
        host.rtm(SENSING);
        expect(host.selfNumber("j"), "Stop freezes the ghost").toBe(1);
        expect(host.midi.length, "a stopped ghost sends nothing").toBe(mid);
        host.run(28);
        expect(
          sim.layer(hwOfCell(80), 1).pha,
          "the key still pulses while stopped",
        ).toBeGreaterThan(0);
        // Continue resumes from the frozen point; Start restarts the loop.
        host.rtm(CONTINUE);
        host.rtm(CLOCK);
        expect(host.selfNumber("j"), "Continue resumes at the next point").toBe(
          2,
        );
        expect(
          xsOf(host.midi, mid),
          "point 2 is still the first cell (six ticks a cell)",
        ).toEqual([pathX[0]]);
        host.rtm(START);
        expect(host.selfNumber("j"), "Start restarts the loop").toBe(0);
        host.rtm(CLOCK);
        expect(host.selfNumber("j")).toBe(1);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        report.push(
          `  External, one point a clock: ${n} points recorded live on the Timer, none replayed by it; Start then ${n} clocks replayed the loop once on CC ${cc}; Stop froze it; Continue resumed; Start restarted it`,
        );
      } finally {
        host.close();
      }
    }

    // 2. DIVISION: three clocks a point stretches the loop threefold.
    {
      const { host } = await openSynced(entry, { sync: 1, division: 2 });
      try {
        const n = draw(host);
        const after = host.midi.length;
        host.rtm(START);
        host.rtm(CLOCK);
        expect(host.selfNumber("j"), "the first clock is point 1").toBe(1);
        host.rtm(CLOCK);
        host.rtm(CLOCK);
        expect(host.selfNumber("j"), "two more clocks: still point 1").toBe(1);
        host.rtm(CLOCK);
        expect(host.selfNumber("j"), "the fourth clock is point 2").toBe(2);
        for (let k = 0; k < 3 * n - 4; k += 1) host.rtm(CLOCK);
        expect(host.selfNumber("j"), `3n clocks replay all ${n} points`).toBe(
          n,
        );
        expect(xsOf(host.midi, after).length, "one pair per point").toBe(n);
        report.push(
          `  Division 3 clocks a point: ${n} points over ${3 * n} clocks`,
        );
      } finally {
        host.close();
      }
    }

    // 3. THE WORDS AND THE PREVIEW: Sync is worded, the division is a bare
    //    count on a stepper (1 / 2 / 3 collide with the other mode tables' keys).
    expect(
      syncKnob.values.map((literal) =>
        wordFor(syncKnob.kind, literal, syncKnob.id),
      ),
    ).toEqual(["Internal", "External"]);
    expect(widgetFor(syncKnob.kind, syncKnob.values, syncKnob.id)).toBe(
      "words",
    );
    expect(divisionKnob.values).toEqual(["1", "2", "3"]);
    expect(widgetFor(divisionKnob.kind, divisionKnob.values)).toBe("stepper");
    expect(previewIndices(entry, { ...entry.defaults, sync: 1 })?.sync).toBe(0);
    process.stdout.write(
      "\nGHOST on the DAW's clock (change 12, 2026-09-18):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length).toBe(2);
  }, 120000);

  it("runs RADAR as the compiled preset and on the DAW's clock: Internal renders the shelf preset's frame byte for byte with and without a finger and sends the first finger's raw CC pair as the preset does, External freezes the ring from the Setup and the Timer moves nothing, Start puts the ring at the centre on the first clock, a step every Division clocks, Stop halts, Continue resumes, the finger still sends, and the preview holds Internal", async () => {
    // Change 12b (2026-09-18, BENCH-2026-09-16.txt section 12): the ported
    // RADAR preset rebuilt by hand under its own id. The proof of the rebuild
    // is the shelf preset itself, run natively in a PadSim over the same
    // ticks and the same finger, compared frame for frame.
    const entry = entryById("radar");
    const cc = knobValueOf(entry, "send");
    const speed = knobValueOf(entry, "speed");
    const speedKnob = entry.knobs.find((knob) => knob.id === "speed");
    const syncKnob = entry.knobs.find((knob) => knob.id === "sync");
    const divisionKnob = entry.knobs.find((knob) => knob.id === "division");
    if (!speedKnob || !syncKnob || !divisionKnob)
      throw new Error("radar: speed, sync and division knobs expected");
    const shelf = presetById("radar");
    if (!shelf) throw new Error("the shelf lost the radar preset");
    expect(shelf.state.look.speed, "the preset's default detent").toBe(speed);
    expect(speedKnob.values.map(Number), "the preset's eight detents").toEqual([
      1, 2, 3, 4, 6, 8, 12, 16,
    ]);
    const pha = (sim: PadSim, cell: number): number =>
      sim.layer(hwOfCell(cell), 2).pha;
    const frameOf = (bytes: Uint8Array): string =>
      Buffer.from(bytes).toString("hex");
    const report: string[] = [];

    // INTERNAL, beside the compiled preset. The same ticks, the same finger on
    // LED (4,4) then (6,2), the same lift; every frame equal.
    {
      const native = new PadSim(shelf.state);
      const { host, sim } = await openSynced(entry, {});
      try {
        expect(host.rxMode, "Internal leaves MIDIRTM unrouted").toBe(0);
        expect(sim.layer(hwOfCell(40), 2).fre, "the walk at 256-@SPEED").toBe(
          256 - speed,
        );
        expect(pha(sim, 40), "the centre starts at phase 0").toBe(0);
        expect(pha(sim, 41), "ring 1 east at 45").toBe(45);
        const ticks = [0, 1, 37, 64, 101, 128, 300];
        let at = 0;
        for (const tick of ticks) {
          host.run(tick - at);
          native.run(tick - at);
          at = tick;
          expect(
            frameOf(host.frame),
            `tick ${tick}: the Lua card renders the preset's frame`,
          ).toBe(frameOf(native.frame));
        }
        expect(host.midi, "nothing sent with no finger").toHaveLength(0);
        // The first finger: press dead on LED (4,4), move to (6,2), lift. The
        // wire is the compiler's xy emitter: the RAW pair on press and on every
        // move, X on @CC and Y on @CC+1, channel 0, nothing on the lift.
        const x0 = ledCentre(4, "x");
        const y0 = ledCentre(4, "y");
        const x1 = ledCentre(6, "x");
        const y1 = ledCentre(2, "y");
        host.touchDown(0, x0, y0);
        native.touchDown(0, x0, y0);
        host.run(1);
        native.run(1);
        expect(wire(host.midi, 0), "the press sends the raw pair").toEqual([
          `0:176:${cc}:${x0}`,
          `0:176:${cc + 1}:${y0}`,
        ]);
        expect(
          frameOf(host.frame),
          "under a finger the Lua card renders the preset's frame",
        ).toBe(frameOf(native.frame));
        host.touchMove(0, x1, y1);
        native.touchMove(0, x1, y1);
        host.run(1);
        native.run(1);
        expect(wire(host.midi, 2), "the move sends the raw pair").toEqual([
          `0:176:${cc}:${x1}`,
          `0:176:${cc + 1}:${y1}`,
        ]);
        // A second finger while the first is held: the preset's `fingers:
        // "first"` - nothing on the wire from it.
        host.touchDown(1, x0, y0);
        native.touchDown(1, x0, y0);
        host.run(1);
        native.run(1);
        expect(host.midi, "the second finger sends nothing").toHaveLength(4);
        host.touchUp(1, x0, y0);
        native.touchUp(1, x0, y0);
        host.touchUp(0, x1, y1);
        native.touchUp(0, x1, y1);
        host.run(1);
        native.run(1);
        expect(host.midi, "the lift sends nothing").toHaveLength(4);
        expect(
          frameOf(host.frame),
          "after the lift the Lua card renders the preset's frame",
        ).toBe(frameOf(native.frame));
        host.run(60);
        native.run(60);
        expect(
          frameOf(host.frame),
          "sixty ticks on, the comet's decay agrees byte for byte",
        ).toBe(frameOf(native.frame));
        // After the release a new first finger claims the stream again.
        host.touchDown(2, x1, y1);
        host.run(1);
        expect(wire(host.midi, 4), "the next finger claims the pair").toEqual([
          `0:176:${cc}:${x1}`,
          `0:176:${cc + 1}:${y1}`,
        ]);
        host.touchUp(2, x1, y1);
        host.run(1);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        report.push(
          `  Internal: frames equal to the shelf preset's PadSim at ticks ${ticks.join(", ")}, under the finger, after the lift and sixty ticks on; the press and the move sent CC ${cc} / ${cc + 1} raw on channel 0, the second finger and the lift nothing, the next finger claimed the pair`,
        );
      } finally {
        host.close();
      }
    }

    // EXTERNAL: the Setup freezes the walk (fre 0), the ring waits at the
    // centre; the clock steps it eight times a ring; the finger is unaffected.
    {
      const { host, sim } = await openSynced(entry, { sync: 1 });
      try {
        expect(host.rxMode, "External asks grxm(2,3)").toBe(3);
        expect(sim.layer(hwOfCell(40), 2).fre, "the walk is frozen").toBe(0);
        expect(pha(sim, 40)).toBe(0);
        expect(pha(sim, 41)).toBe(45);
        host.run(300);
        expect(pha(sim, 40), "300 Timer ticks move nothing").toBe(0);
        expect(pha(sim, 41)).toBe(45);
        expect(host.selfNumber("k"), "no step yet").toBe(0);
        for (let n = 0; n < 12; n += 1)
          expect(host.rtm(CLOCK), "the handler exists").toBe(true);
        expect(pha(sim, 40), "clocks before Start move nothing").toBe(0);
        expect(host.selfNumber("k")).toBe(0);
        // Start: the step lives in the Setup, so the very first clock steps -
        // step 0 is the rest picture, the ring at the centre.
        host.rtm(START);
        host.rtm(CLOCK);
        expect(
          host.selfNumber("k"),
          "the first clock after Start is step 0",
        ).toBe(1);
        expect(pha(sim, 40), "step 0 is the rest picture").toBe(0);
        expect(pha(sim, 41)).toBe(45);
        for (let n = 0; n < 6; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), "the seventh clock is step 1").toBe(2);
        expect(pha(sim, 40), "the centre walked 32").toBe(224);
        expect(pha(sim, 41), "ring 1 east walked 32").toBe(13);
        expect(sim.layer(hwOfCell(40), 2).fre, "glp leaves the rate at 0").toBe(
          0,
        );
        const before = host.midi.length;
        host.run(200);
        expect(pha(sim, 40), "200 Timer ticks move nothing").toBe(224);
        expect(host.midi.length, "nor send").toBe(before);
        // The finger under External: the same pair, the mode changes nothing.
        const x0 = ledCentre(4, "x");
        const y0 = ledCentre(4, "y");
        host.touchDown(0, x0, y0);
        host.run(1);
        host.touchUp(0, x0, y0);
        host.run(1);
        expect(
          wire(host.midi, before),
          "the finger still sends its pair",
        ).toEqual([`0:176:${cc}:${x0}`, `0:176:${cc + 1}:${y0}`]);
        // Stop halts: clocks and active sensing move nothing.
        host.rtm(STOP);
        for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
        host.rtm(SENSING);
        for (let n = 0; n < 12; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), "Stop halts the ring").toBe(2);
        expect(pha(sim, 40), "where it stopped").toBe(224);
        // Continue keeps the count: seven clocks were counted since Start
        // (q = 7), so the sixth clock on is q = 12 and lands step 2.
        host.rtm(CONTINUE);
        expect(host.selfNumber("q"), "Continue keeps the clock count").toBe(7);
        for (let n = 0; n < 5; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), "five clocks on: not yet stepped").toBe(2);
        host.rtm(CLOCK);
        expect(host.selfNumber("k"), "step 2").toBe(3);
        expect(pha(sim, 40), "the centre walked 64").toBe(192);
        // Eight steps a ring: six more steps walk k through 3..7 and 0, and
        // the picture back to rest; `s.k` reads k+1 with k taken %8, so 1.
        for (let n = 0; n < 6 * 6; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), "eight steps a ring").toBe(1);
        expect(pha(sim, 40), "step 0 again: the rest picture").toBe(0);
        expect(pha(sim, 41)).toBe(45);
        // Start again: the ring is back at the centre on the clock.
        for (let n = 0; n < 6 * 3; n += 1) host.rtm(CLOCK);
        expect(pha(sim, 40), "three steps in").toBe(160);
        host.rtm(START);
        expect(host.selfNumber("k"), "Start resets the step").toBe(0);
        host.rtm(CLOCK);
        expect(pha(sim, 40), "and the clock puts the ring at the centre").toBe(
          0,
        );
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        report.push(
          "  External at the 16th: the walk frozen from the Setup, 300 and 200 Timer ticks moved nothing, step 0 on the first clock after Start (the step is a Setup local, so no first-period caveat), the centre at 224 on the seventh, the finger's pair unchanged, Stop held it at 224, Continue went on from clock 7 to 192 on the sixth, eight steps wrapped to the rest picture, Start put the ring back at the centre",
        );
      } finally {
        host.close();
      }
    }

    // Division 12 and 3: twelve and three clocks a step.
    for (const [division, clocks] of [
      [0, 12],
      [2, 3],
    ] as const) {
      const { host, sim } = await openSynced(entry, { sync: 1, division });
      try {
        host.rtm(START);
        host.rtm(CLOCK);
        expect(host.selfNumber("k")).toBe(1);
        for (let n = 0; n < clocks; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), `${clocks} clocks a step`).toBe(2);
        expect(pha(sim, 40)).toBe(224);
        for (let n = 0; n < clocks - 1; n += 1) host.rtm(CLOCK);
        expect(host.selfNumber("k"), "one short of the next").toBe(2);
        host.rtm(CLOCK);
        expect(host.selfNumber("k")).toBe(3);
        report.push(
          `  Division ${clocks} clocks a step: steps at clocks 1, ${1 + clocks}, ${1 + 2 * clocks} after Start`,
        );
      } finally {
        host.close();
      }
    }
    expect(
      syncKnob.values.map((literal) =>
        wordFor(syncKnob.kind, literal, syncKnob.id),
      ),
    ).toEqual(["Internal", "External"]);
    expect(
      divisionKnob.values.map((literal) => wordFor(divisionKnob.kind, literal)),
    ).toEqual(["8th", "16th", "32nd"]);
    expect(previewIndices(entry, { ...entry.defaults, sync: 1 })?.sync).toBe(0);
    process.stdout.write(
      "\nRADAR as the compiled preset and on the DAW's clock (change 12b, 2026-09-18):\n" +
        report.join("\n") +
        "\n",
    );
    expect(report.length).toBe(4);
  }, 120000);
});

// ---------------------------------------------------------------------------
// THE GRADIENT (phase 12.1, plan 12.1-02): G, E, X and Q in the real VM, with
// every expected phase, cell and band computed from calibration.ts.
//
// THE USER'S SPECIFICATION (12.1-CONTEXT D-01): a finger between two LEDs
// lights both dimly, a finger in the middle of four lights all four, and the
// brightness follows the finger. `G(s,i,e,x,y,l,r,g,b)` in the system Timer
// (255/6) draws that: the calibrated position through `U`, the 2x2 block
// around it, integer bilinear weights over 4096 at peak 255, the colour
// re-asserted on each cell every call (D-11 - layer 0 is the alert layer).
// Every expectation below is the same arithmetic in TypeScript over the SAME
// two knot tables, so a knot that moves in calibration.ts moves the Lua and
// the expectation together, and nothing here is a literal read off a run.
//
// THE CALLBACK ORDER IS `Q` FIRST, THEN `G`, THEN THE ENTRY'S EARLY RETURN -
// A FINDING OF THIS PLAN, NOT THE RESEARCH'S SHAPE. The research and the
// plans wrote `G(...)local m=Q(...)`, and the research's VM only ever called
// `G` on its own. Run together in one callback: on an onset `G` draws the
// block and records it in `B[i]`, and then `Q` expires contact `i` itself
// (the same-id lost-lift rule, library.ts section 7), which reaches `E` and
// `V(B[i])` - and clears the block `G` just drew. A still finger reads DARK
// after its DOWN until its first MOVE, and a second contact landing on a cell
// another contact held has its fresh block cleared by the cross-contact
// expiry. With `Q` first the stale block is what `E` clears, and `G` then
// draws the fresh one: every path is right at the same character cost. Plans
// 12.1-03 and 12.1-04 re-fit the callers in this order; 13-14's emitter must
// emit it in this order.
//
// Nothing here is hardware-verified. The bench sees the gradient at 12.1-09.
// ---------------------------------------------------------------------------

describe("the gradient (12.1)", () => {
  /**
   * The EUCLID (now ORBIT) shape of the callback, with Q first (see the header above):
   * the cell Q returns goes out as CC 1 so the test can read it, and G draws
   * the finger white on layer 0.
   */
  const GRADIENT_SETUP =
    "--[[@cb]]self.touch_cb=function(s,i,e,x,y)local m=Q(s,i,e,x,y)" +
    "G(s,i,e,x,y,0,255,255,255)if m then s:gms(0,176,1,m,0)end end";

  /** The sweep, with the caller's own window, where a test needs it. */
  const GRADIENT_TIMER = "--[[@cb]]gtt(0,10)X(self,20)";

  /** One host over both library strings, optionally with the sweeping Timer. */
  const openGradient = async (
    withTimer: boolean,
    setup: string = GRADIENT_SETUP,
  ) => {
    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup: withTimer ? setup + " gtt(0,10)" : setup,
      timer: withTimer ? GRADIENT_TIMER : undefined,
    });
    return { host, sim };
  };

  const phase0 = (sim: PadSim, cell: number): number =>
    sim.layer(hwOfCell(cell), 0).pha;
  const colour0 = (sim: PadSim, cell: number): number[] => [
    ...sim.layer(hwOfCell(cell), 0).max,
  ];
  /** Every layer-0 cell with a non-zero phase, cell -> phase. */
  const litOnLayer0 = (sim: PadSim): Record<number, number> => {
    const out: Record<number, number> = {};
    for (let cell = 0; cell < 81; cell += 1) {
      const p = phase0(sim, cell);
      if (p !== 0) out[cell] = p;
    }
    return out;
  };
  /** Q's returns, in call order, from the CC 1 the Setup emits. */
  const cellsReturned = (host: { midi: readonly HostMidi[] }): number[] =>
    host.midi.filter((m) => m.cmd === 176 && m.p1 === 1).map((m) => m.p2);

  /**
   * What G must write for a raw point, from the table - the block's four
   * cells and their phases, zeros included. The interfaces block of plan
   * 12.1-02, in TypeScript: `c = min(u // 64, 7)`, `f = u - c*64`, the four
   * weights over 4096 at peak 255, floored as Lua's `//` floors.
   */
  const expectedFinger = (
    x: number,
    y: number,
  ): { block: number[]; phases: Record<number, number> } => {
    const u = calibratedAxis(x, "x");
    const w = calibratedAxis(y, "y");
    const c = Math.min(Math.floor(u / LED_STEP), 7);
    const q = Math.min(Math.floor(w / LED_STEP), 7);
    const f = u - c * LED_STEP;
    const h = w - q * LED_STEP;
    const n = c + q * 9;
    const weight = (a: number, b: number): number =>
      Math.floor((255 * a * b) / 4096);
    const phases: Record<number, number> = {};
    phases[n] = weight(LED_STEP - f, LED_STEP - h);
    phases[n + 1] = weight(f, LED_STEP - h);
    phases[n + 9] = weight(LED_STEP - f, h);
    phases[n + 10] = weight(f, h);
    return { block: [n, n + 1, n + 9, n + 10], phases };
  };
  const litOf = (phases: Record<number, number>): Record<number, number> =>
    Object.fromEntries(Object.entries(phases).filter(([, p]) => p !== 0));

  it("draws the bilinear finger in the colour it is handed, heals a recoloured cell, and U is its TypeScript twin at every value", async () => {
    const report: string[] = [];
    const { host, sim } = await openGradient(false);
    try {
      const press = (x: number, y: number): void => {
        host.touchDown(0, x, y);
        host.tick();
      };
      const lift = (x: number, y: number): void => {
        host.touchUp(0, x, y);
        host.tick();
      };
      const WHITE = [255, 255, 255];

      // THE EIGHT CASES OF 12.1-RESEARCH B.2, ON THE MEASURED KNOTS. Each
      // coordinate is a knot or a knot midpoint from calibration.ts; each
      // expected picture is expectedFinger() over the same table.
      const midX = Math.floor((KX[4] + KX[5]) / 2);
      const midY = Math.floor((KY[4] + KY[5]) / 2);
      const cases: readonly {
        readonly label: string;
        readonly x: number;
        readonly y: number;
      }[] = [
        { label: "dead on LED (4,4)", x: KX[4], y: KY[4] },
        {
          label: "midway between LED 4 and 5 in x, on 4 in y",
          x: midX,
          y: KY[4],
        },
        { label: "the centre of four", x: midX, y: midY },
        { label: "the far corner (127,127)", x: 127, y: 127 },
        { label: "the near corner (0,0)", x: 0, y: 0 },
        { label: "x = 5 inside the saturated first segment", x: 5, y: 0 },
        { label: "THE BENCH CASE, row 1 column 7", x: KX[7], y: KY[1] },
      ];
      for (const c of cases) {
        press(c.x, c.y);
        expect(host.errors, `${c.label}: raised`).toEqual([]);
        const want = expectedFinger(c.x, c.y);
        const got = litOnLayer0(sim);
        report.push(
          `  ${c.label} (${c.x},${c.y}): lit ` +
            Object.entries(got)
              .map(([cell, p]) => `${cell}=${p}`)
              .join(" "),
        );
        // THE PICTURE, EXACTLY: every lit cell is one of the block's four at
        // its computed weight, and nothing else on layer 0 is lit.
        expect(
          got,
          `${c.label}: layer 0 is not the computed bilinear finger`,
        ).toEqual(litOf(want.phases));
        // THE COLOUR, ON ALL FOUR CELLS OF THE BLOCK - including the ones at
        // weight 0, because glc runs before glp on every one of them.
        for (const cell of want.block) {
          expect(
            colour0(sim, cell),
            `${c.label}: cell ${cell} is not in the colour G was handed`,
          ).toEqual(WHITE);
        }
        lift(c.x, c.y);
      }

      // THE THREE SENTENCES, READ OFF THE CASES. Dead on an LED: that LED at
      // peak, alone. Between two: both, dimly, the pair summing to about the
      // peak. Middle of four: all four.
      const alone = expectedFinger(KX[4], KY[4]);
      expect(litOf(alone.phases), "dead on LED (4,4) is cell 40 alone").toEqual(
        { 40: 255 },
      );
      const pair = litOf(expectedFinger(midX, KY[4]).phases);
      expect(
        Object.keys(pair).map(Number).sort(),
        "the pair is 40 and 41",
      ).toEqual([40, 41]);
      const four = litOf(expectedFinger(midX, midY).phases);
      expect(
        Object.keys(four)
          .map(Number)
          .sort((a, b) => a - b),
        "the centre of four is 40, 41, 49, 50",
      ).toEqual([40, 41, 49, 50]);
      // THE BENCH CASE: the LED under the finger, where the naive divisor lit
      // the corner. The naive cell is COMPUTED here as the entries used to
      // compute it, never typed - on these knots it is the top-right corner
      // the user reported (12.1-CONTEXT D-01: "row 2 column 8 ... the top
      // right LED lights up").
      const bench = litOf(expectedFinger(KX[7], KY[1]).phases);
      const naiveBench =
        Math.floor((KX[7] * 9) / 128) + Math.floor((KY[1] * 9) / 128) * 9;
      report.push(
        `  the bench case (${KX[7]},${KY[1]}): calibrated cell ` +
          `${Object.keys(bench).join(",")}, naive cell ${naiveBench}`,
      );
      expect(
        bench,
        "the bench case lights the LED under the finger, alone",
      ).toEqual({ 16: 255 });
      expect(
        naiveBench,
        "the naive divisor reads the bench case as a different cell - the " +
          "corner the user saw",
      ).not.toBe(16);
      expect(
        litOf(expectedFinger(127, 127).phases),
        "(127,127) is cell 80 alone, at peak",
      ).toEqual({ 80: 255 });

      // A LIFT DARKENS LAYER 0. The last case above lifted; the layer is
      // dark, and it is asserted rather than assumed.
      press(KX[4], KY[4]);
      expect(litOnLayer0(sim)[40], "the press lit 40").toBe(255);
      lift(KX[4], KY[4]);
      expect(litOnLayer0(sim), "a lift (code 5) leaves layer 0 dark").toEqual(
        {},
      );

      // THE COLOUR HEALS (D-11). Layer 0 is the alert layer: grid_alert_all_set
      // recolours it WHITE_DIM (64,64,64) on a page-discard completion, PURPLE
      // on a refused page change, BLUE on a TX overflow. The same rewrite,
      // done here through the sim's own layer hook on cell 40; the next
      // sample's G re-asserts white on the cell.
      sim.pokeLayer(hwOfCell(40), 0, glcStops(64, 64, 64, true));
      expect(colour0(sim, 40), "the alert took the colour").toEqual([
        64, 64, 64,
      ]);
      press(KX[4], KY[4]);
      expect(
        colour0(sim, 40),
        "the finger did not heal the alert's colour on its next sample",
      ).toEqual(WHITE);
      expect(phase0(sim, 40), "and it is lit at peak").toBe(255);
      lift(KX[4], KY[4]);
      report.push(
        "  the colour heals: 64,64,64 -> 255,255,255 on the next sample",
      );
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }

    // THE TS TWIN. The Lua U(v, KX) and U(v, KY) for every v in 0..127, read
    // back through the MIDI recorder (CC 1 for x, CC 2 for y; p2 carries U,
    // which the recorder does not narrow), against calibratedAxis().
    const twin = await createLuaHost({
      sim: new PadSim(blankPadState()),
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup:
        "--[[@cb]]for v=0,127 do self:gms(0,1,v,U(v,KX),0)" +
        "self:gms(0,2,v,U(v,KY),0)end",
    });
    try {
      expect(twin.errors, "the twin probe raised").toEqual([]);
      expect(twin.midi, "256 readings").toHaveLength(256);
      const mismatches: string[] = [];
      for (const m of twin.midi) {
        const axis = m.cmd === 1 ? "x" : "y";
        const want = calibratedAxis(m.p1, axis);
        if (m.p2 !== want)
          mismatches.push(`${axis}=${m.p1}: Lua ${m.p2}, TS ${want}`);
      }
      expect(
        mismatches.join("; "),
        "the Lua U and calibratedAxis() disagree, so every expectation " +
          "computed from the table is computed from a different function " +
          "than the one on the module",
      ).toBe("");
      report.push(
        "  U(v,K) equals calibratedAxis(v) for all 128 values on both axes",
      );
    } finally {
      twin.close();
    }

    process.stdout.write(
      "\nTHE GRADIENT, G in the real VM (plan 12.1-02):\n" +
        report.join("\n") +
        "\n",
    );
  }, 60000);

  it("clears a contact's block through E on the Timer sweep and on a lost-lift re-press", async () => {
    const report: string[] = [];

    // 1. THE SWEEP. Two fingers; the second goes quiet and X(s,20) in the
    //    Timer expires it through E, which clears its block through V. The
    //    first keeps wobbling, so it is never swept and its block stays lit -
    //    the assertion is "dark for ITS block", not "dark".
    {
      const { host, sim } = await openGradient(true);
      try {
        host.touchDown(0, KX[4], KY[4]);
        host.tick();
        host.touchDown(1, KX[1], KY[1]);
        host.tick();
        const second = expectedFinger(KX[1], KY[1]);
        expect(
          litOnLayer0(sim),
          "both fingers lit, each alone on its LED",
        ).toEqual({
          ...litOf(expectedFinger(KX[4], KY[4]).phases),
          ...litOf(second.phases),
        });
        expect(host.globalSize("B"), "two blocks recorded").toBe(2);

        // Forty ticks: contact 0 alternates two coordinates inside LED 4 (the
        // host's FIFO is change-gated, so a repeated point would never reach
        // the VM), contact 1 says nothing.
        for (let t = 0; t < 40; t += 1) {
          host.touchMove(0, KX[4] + (t % 2), KY[4]);
          host.tick();
        }
        const lit = litOnLayer0(sim);
        report.push(
          `  sweep: after 40 ticks of silence from contact 1, lit ` +
            Object.entries(lit)
              .map(([cell, p]) => `${cell}=${p}`)
              .join(" "),
        );
        for (const cell of second.block) {
          expect(
            phase0(sim, cell),
            `the swept contact's block is still lit at cell ${cell}: E did ` +
              "not clear it through V on the Timer sweep",
          ).toBe(0);
        }
        expect(
          phase0(sim, 40),
          "the wobbling finger is still lit",
        ).toBeGreaterThan(0);
        expect(host.globalSize("B"), "one block left, the live finger's").toBe(
          1,
        );
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }

    // 2. THE LOST LIFT. The same id presses again on a different cell with no
    //    lift in between - firmware assigns the lowest free contact id, so
    //    this is the sequence hardware normally takes (library.ts section 7).
    //    Q's onset self-expiry reaches E, which clears the stale block; G then
    //    draws the new one.
    {
      const { host, sim } = await openGradient(false);
      try {
        host.touchDown(0, KX[4], KY[4]);
        host.tick();
        expect(phase0(sim, 40), "the first press lit 40").toBe(255);
        host.touchDown(0, KX[1], KY[1]);
        host.tick();
        const want = litOf(expectedFinger(KX[1], KY[1]).phases);
        const got = litOnLayer0(sim);
        report.push(
          `  lost lift: re-press by the same id on (${KX[1]},${KY[1]}) -> lit ` +
            Object.entries(got)
              .map(([cell, p]) => `${cell}=${p}`)
              .join(" "),
        );
        expect(
          got,
          "after a same-id re-press the OLD block must be dark and the new " +
            "one lit; a stale block left lit is a finger nobody is touching",
        ).toEqual(want);
        expect(
          cellsReturned(host),
          "Q returned a cell for both presses - the lost lift did not swallow " +
            "the second (library.ts section 7)",
        ).toEqual([40, 10]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // MORPH's shape - G before an early return without Q - is plan 12.1-04's.

    process.stdout.write(
      "\nTHE GRADIENT, E and X clear the block (plan 12.1-02):\n" +
        report.join("\n") +
        "\n",
    );
  }, 60000);

  it("holds Q's cell across a band that is a fraction of the LED pitch, per segment, and lands the bench case on cell 16", async () => {
    // D-18: `W` holds the previous LED while the calibrated coordinate is
    // within 45/64 of a pitch of its centre. In raw sensor units that band is
    // as wide as the local pitch makes it - the assertion is the formula on
    // the table, the printed width is the observation, and no width is typed.
    const report: string[] = [];
    const { host } = await openGradient(false);
    try {
      const y = KY[4];
      const walk = (
        from: number,
        to: number,
        expectCell: number,
      ): number | undefined => {
        const step = to > from ? 1 : -1;
        for (let x = from + step; step > 0 ? x <= to : x >= to; x += step) {
          host.touchMove(0, x, y);
          host.tick();
          if (cellsReturned(host).at(-1) === expectCell) return x;
        }
        return undefined;
      };
      const HOLD = holdFraction();
      for (const p of [4, 7, 2]) {
        const lo = p + 36;
        const hi = p + 37;
        // Up: press on LED p, walk right to LED p+1's knot.
        host.touchDown(0, KX[p], y);
        host.tick();
        expect(
          cellsReturned(host).at(-1),
          `the press landed on cell ${lo}`,
        ).toBe(lo);
        const upObserved = walk(KX[p], KX[p + 1], hi);
        host.touchUp(0, KX[p + 1], y);
        host.tick();
        // Down: press on LED p+1, walk left to LED p's knot.
        host.touchDown(0, KX[p + 1], y);
        host.tick();
        expect(
          cellsReturned(host).at(-1),
          `the press landed on cell ${hi}`,
        ).toBe(hi);
        const downObserved = walk(KX[p + 1], KX[p], lo);
        host.touchUp(0, KX[p], y);
        host.tick();

        const upExpected = switchUp(p, "x");
        const downExpected = switchDown(p, "x");
        const band: number[] = [];
        for (let x = downExpected + 1; x < (upExpected ?? 0); x += 1)
          band.push(x);
        report.push(
          `  LED ${p} -> ${p + 1} in x (pitch ${KX[p + 1] - KX[p]}): up at ` +
            `${upObserved}, down at ${downObserved}; band ${band[0]}..` +
            `${band[band.length - 1]}, ${band.length} values`,
        );
        expect(
          upObserved,
          `LED ${p} -> ${p + 1}: the up-switch is the first x with ` +
            `calibratedAxis(x) >= ${p}*64 + ${HOLD}`,
        ).toBe(upExpected);
        expect(
          downObserved,
          `LED ${p + 1} -> ${p}: the down-switch is the first x with ` +
            `calibratedAxis(x) <= ${p + 1}*64 - ${HOLD}`,
        ).toBe(downExpected);
        expect(
          band.length,
          `LED ${p} -> ${p + 1}: the band is empty, so the hysteresis is a ` +
            "dead zone or nothing",
        ).toBeGreaterThan(0);
      }

      // THE BENCH CASE, THROUGH Q: the same cell G lights (test 1), so the
      // toggle and the glow agree on where the LED is because both read U.
      host.touchDown(0, KX[7], KY[1]);
      host.tick();
      const benchCell = cellsReturned(host).at(-1);
      const naiveBench =
        Math.floor((KX[7] * 9) / 128) + Math.floor((KY[1] * 9) / 128) * 9;
      report.push(
        `  the bench case (${KX[7]},${KY[1]}): Q returns ${benchCell}, ` +
          `the naive divisor read ${naiveBench}`,
      );
      expect(benchCell, "a press on row 1 column 7 returns cell 16").toBe(16);
      expect(benchCell, "and G lights the same cell").toBe(
        Number(Object.keys(litOf(expectedFinger(KX[7], KY[1]).phases))[0]),
      );
      host.touchUp(0, KX[7], KY[1]);
      host.tick();
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nTHE GRADIENT, Q's hold band per segment (plan 12.1-02, D-18):\n" +
        report.join("\n") +
        "\n",
    );
  }, 60000);

  /**
   * The finger colour an entry hands to G, READ OFF THE RENDERED SETUP - the
   * three literals after the layer in its one `G(s,i,e,x,y,0,r,g,b)` call
   * (white on ORBIT and STEPS, the rendered @SWEEPC on RADAR POINTS and SONAR;
   * 12.1-CONTEXT D-13). Not read off a knob: STEPS has a @SWEEPC knob of its
   * own for the sweeping column and hands G white regardless.
   */
  const fingerColourOf = (entry: CatalogEntry): number[] => {
    const { setup } = renderLua(entry);
    const calls = [...setup.matchAll(/G\(s,i,e,x,y,0,(\d+),(\d+),(\d+)\)/g)];
    if (calls.length !== 1)
      throw new Error(`${entry.id}'s Setup calls G ${calls.length} times`);
    return calls[0].slice(1, 4).map(Number);
  };

  /** The Timer's sweep window `X(s,n)`, read off the rendered Timer. */
  const sweepWindowOf = (entry: CatalogEntry): number => {
    const { timer } = renderLua(entry);
    const m = /X\(s,(\d+)\)/.exec(timer);
    if (!m) throw new Error(`${entry.id}'s Timer carries no X(s,n) sweep`);
    return Number(m[1]);
  };

  it("draws the finger on all 81 LED centres of ORBIT, STEPS, RADAR POINTS and SONAR in each entry's colour, toggles ORBIT's third ring on the first tap, and keeps the sweeps' centre dot through a sweep expiry and a lost-lift re-press", async () => {
    // PLAN 12.1-03. Each of the four sequencers now writes `Q` first, then
    // `G(s,i,e,x,y,0,<colour>)`, so the cell Q toggles and the LED G lights are
    // the same LED because both read U over the measured map. RADAR POINTS
    // and SONAR also define `R`, which re-lights and re-colours cell 40 after
    // every G and on every expiry through E (D-15) - and cell 40 is the one
    // layer-0 cell those two hold at 255 always. Every coordinate here is a
    // knot from calibration.ts, never a literal.
    const report: string[] = [];
    const SWEEPS = new Set(["radar-points", "sonar"]);
    const midX = Math.floor((KX[4] + KX[5]) / 2);

    for (const id of ["orbit", "steps", "radar-points", "sonar"]) {
      const entry = entryById(id);
      const sweep = SWEEPS.has(id);
      const colour = fingerColourOf(entry);
      const centre: Record<number, number> = sweep ? { 40: 255 } : {};
      const { host, sim } = await open(entry);
      try {
        expect(host.errors, `${id}: the Setup raised`).toEqual([]);
        expect(
          litOnLayer0(sim),
          `${id}: layer 0 at rest is the centre dot alone (or dark)`,
        ).toEqual(centre);

        // 1. ALL 81 LED CENTRES. Press dead on LED (c, r), read layer 0 while
        //    pressed, lift, read again. The picture is exact: that one cell at
        //    255 in the entry's colour and no other layer-0 cell above 0 -
        //    save the sweeps' centre, which is at 255 whatever the finger does.
        const identity: string[] = [];
        for (let r = 0; r < 9; r += 1) {
          let row = "";
          for (let c = 0; c < 9; c += 1) {
            const cell = c + r * 9;
            host.touchDown(0, KX[c], KY[r]);
            host.tick();
            const got = litOnLayer0(sim);
            expect(
              got,
              `${id}: a press dead on LED (${c},${r}) at (${KX[c]},${KY[r]}) ` +
                "must light exactly its own cell at 255 on layer 0",
            ).toEqual({ ...centre, [cell]: 255 });
            expect(
              colour0(sim, cell),
              `${id}: cell ${cell} is not in the entry's finger colour`,
            ).toEqual(colour);
            row += got[cell] === 255 ? "#" : ".";
            host.touchUp(0, KX[c], KY[r]);
            host.tick();
            expect(
              litOnLayer0(sim),
              `${id}: after the lift from LED (${c},${r}) layer 0 is not back ` +
                "to its rest picture",
            ).toEqual(centre);
          }
          identity.push(row);
        }
        expect(host.errors, `${id}: ${host.errors.join(" | ")}`).toEqual([]);
        if (id === "orbit") {
          report.push(
            "  ORBIT, the 81 LED centres, # where the press lit its own cell " +
              "alone (the map is the identity):",
          );
          for (const row of identity) report.push(`    ${row}`);
        }
        expect(
          identity.join(""),
          `${id}: some LED centre did not light its own cell`,
        ).toBe("#".repeat(81));

        // 2. THE MIDPOINT between LED 4 and 5 in x on row 4: exactly two
        //    layer-0 cells, 40 and 41, at the bilinear weights - on the sweeps
        //    R holds 40 at 255 over G's weight, and it is still exactly two.
        host.touchDown(0, midX, KY[4]);
        host.tick();
        const pair = litOf(expectedFinger(midX, KY[4]).phases);
        expect(Object.keys(pair), "the midpoint is a pair").toHaveLength(2);
        const midGot = litOnLayer0(sim);
        expect(
          Object.keys(midGot),
          `${id}: the midpoint press lights exactly two layer-0 cells`,
        ).toHaveLength(2);
        expect(
          midGot,
          `${id}: the midpoint pair at the computed weights`,
        ).toEqual({ ...pair, ...centre });
        report.push(
          `  ${entry.name}: midpoint (${midX},${KY[4]}) lit ` +
            Object.entries(midGot)
              .map(([cell, p]) => `${cell}=${p}`)
              .join(" ") +
            `, finger colour ${colour.join(",")}`,
        );
        host.touchUp(0, midX, KY[4]);
        host.tick();

        // 2b. A HARDWARE FAST TAP (code 9, a press AND a lift in one message)
        //     leaves NO finger on layer 0 - there is nobody touching the pad
        //     after it. Found by the residue gate (test 4 of the CONT-02
        //     block) on the first run of this plan: G's end test was Q's live
        //     test, `e~=1 and e~=4 and e<9`, so a 9 drew a block that stayed
        //     lit until the Timer's sweep expired the contact. G now returns
        //     on a 9; Q still returns the cell, so the step still toggles.
        {
          const cell = 2 + 2 * 9;
          const layer = id === "steps" ? 2 : 1;
          const before = sim.layer(hwOfCell(cell), layer).pha;
          host.touchTap(0, KX[2], KY[2]);
          host.tick();
          expect(
            litOnLayer0(sim),
            `${id}: a fast tap (code 9) left a finger on layer 0 with nobody ` +
              "touching the pad",
          ).toEqual(centre);
          expect(
            sim.layer(hwOfCell(cell), layer).pha,
            `${id}: the fast tap's press half did not reach the entry through Q`,
          ).not.toBe(before);
          expect(host.globalSize("B"), `${id}: no block recorded for a 9`).toBe(
            0,
          );
        }

        // 3. THE THIRD RING (EUCLID's outer one until change 8), the tap the
        //    bench said needed several tries. LED (1,4) is cell 37, Chebyshev
        //    distance 3. The naive divisor reads that same press as a cell on
        //    the square outside it (computed here) - on NO ring while EUCLID had
        //    three, which is why `if not v then return end` dropped it silently;
        //    on ORBIT that square is the fourth ring, so the naive read would
        //    have toggled the WRONG ring. Through Q it flips the right step on
        //    the first try, seen on layer 1.
        if (id === "orbit") {
          const cell = 1 + 4 * 9;
          const naive =
            Math.floor((KX[1] * 9) / 128) + Math.floor((KY[4] * 9) / 128) * 9;
          const before = sim.layer(hwOfCell(cell), 1).pha;
          host.touchDown(0, KX[1], KY[4]);
          host.tick();
          const after = sim.layer(hwOfCell(cell), 1).pha;
          host.touchUp(0, KX[1], KY[4]);
          host.tick();
          report.push(
            `  ORBIT: a press dead on LED (1,4) toggles cell ${cell} (ring ` +
              `${ringOf(cell)}): layer 1 ${before} -> ${after}; the naive ` +
              `divisor read cell ${naive} (ring ${ringOf(naive)}, the wrong ring)`,
          );
          expect(ringOf(cell), "cell 37 is on the third ring").toBe(3);
          expect(
            after,
            "ORBIT: the first tap on the third ring did not flip the step",
          ).not.toBe(before);
          expect(
            ringOf(naive),
            "the naive divisor reads the third-ring press as a cell on the " +
              "square outside it - the tap that needed several tries",
          ).toBe(4);
        }

        // 4. THE CENTRE DOT ON THE EXPIRY PATHS (sweeps only; D-15, the
        //    plan-check's finding). Press dead on the centre so G's block is
        //    cells 40, 41, 49, 50; never lift; let the Timer's X(s,n) sweep
        //    expire the quiet contact - E clears the block through V, then
        //    calls R, which must put 40 back at 255 in @SWEEPC.
        if (sweep) {
          const n = sweepWindowOf(entry);
          const periodTicks = knobValueOf(entry, "sweep") / 10;
          expect(
            Number.isInteger(periodTicks),
            `${id}: the sweep period is a whole number of ticks`,
          ).toBe(true);
          host.touchDown(0, KX[4], KY[4]);
          host.tick();
          expect(host.globalSize("B"), `${id}: G recorded the block`).toBe(1);
          expect(
            litOnLayer0(sim),
            `${id}: the centre press is 40 alone`,
          ).toEqual({ 40: 255 });
          host.run((n + 2) * periodTicks);
          expect(
            host.globalSize("B"),
            `${id}: the Timer sweep did not expire the quiet contact, so ` +
              "the clause below proves nothing",
          ).toBe(0);
          expect(
            phase0(sim, 40),
            `${id}: cell 40 went dark on the Timer sweep - E cleared the ` +
              "block through V and nothing re-lit the centre",
          ).toBe(255);
          expect(
            colour0(sim, 40),
            `${id}: R did not re-colour the centre`,
          ).toEqual(colour);
          expect(
            litOnLayer0(sim),
            `${id}: after the sweep only the centre is lit`,
          ).toEqual({ 40: 255 });
          report.push(
            `  ${entry.name}: held on the centre, ${n + 2} Timer calls ` +
              `(${(n + 2) * periodTicks} ticks) later B is empty and 40=` +
              `${phase0(sim, 40)} in ${colour0(sim, 40).join(",")}`,
          );

          // The lost-lift re-press, as the plan drives it: the same id, a
          // different cell, no lift since the sweep.
          host.touchDown(0, KX[1], KY[1]);
          host.tick();
          expect(
            litOnLayer0(sim),
            `${id}: after the re-press the new LED and the centre, only`,
          ).toEqual({ 10: 255, 40: 255 });

          // And the re-press OVER a block that covers 40, which is the path
          // that actually reaches V with the centre inside it: press the
          // centre again (block 40..50), then the same id lands elsewhere
          // with no lift - Q's onset self-expiry clears that block, R
          // re-lights 40, G draws the new one.
          host.touchDown(0, KX[4], KY[4]);
          host.tick();
          expect(host.globalSize("B"), `${id}: the block is on 40`).toBe(1);
          host.touchDown(0, KX[7], KY[7]);
          host.tick();
          const relit = litOnLayer0(sim);
          expect(
            relit,
            `${id}: a lost-lift re-press over the centre must leave 40 lit ` +
              "and the old block dark",
          ).toEqual({ 40: 255, 70: 255 });
          expect(colour0(sim, 40), `${id}: 40 in @SWEEPC`).toEqual(colour);
          report.push(
            `  ${entry.name}: lost-lift re-press from the centre to LED (7,7) ` +
              `-> lit ` +
              Object.entries(relit)
                .map(([cell, p]) => `${cell}=${p}`)
                .join(" "),
          );
          host.touchUp(0, KX[7], KY[7]);
          host.tick();
          expect(
            litOnLayer0(sim),
            `${id}: after the lift the centre alone`,
          ).toEqual({ 40: 255 });
        }
        expect(host.errors, `${id}: ${host.errors.join(" | ")}`).toEqual([]);
      } finally {
        host.close();
      }
    }

    process.stdout.write(
      "\nTHE GRADIENT ON THE FOUR SEQUENCERS (plan 12.1-03):\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);

  it("stops ARC on the calibrated centre through N, where the naive divisor would have missed", async () => {
    // PLAN 12.1-03: ARC's stop tap is `N(x,y)==40` in place of
    // `x*9//128+y*9//128*9==40`. Two presses: dead on LED (4,4), and one unit
    // past the midpoint between LED 3 and LED 4 in x on row 4, which
    // calibratedAxis rounds to LED 4 and the naive divisor to column 3. Both
    // must stop the swirl. The "stopped" observable is 11-09.1's: layer 2's
    // rate at cell (0,0) is 0 while stopped and non-zero while running.
    const entry = entryById("arc");
    const naiveCellOf = (x: number, y: number): number =>
      Math.floor((x * 9) / 128) + Math.floor((y * 9) / 128) * 9;
    const offCentreX = KX[3] + Math.floor((KX[4] - KX[3]) / 2) + 1;
    const probes: readonly { label: string; x: number; y: number }[] = [
      { label: "dead on LED (4,4)", x: KX[4], y: KY[4] },
      { label: "one past the LED 3 -> 4 midpoint", x: offCentreX, y: KY[4] },
    ];
    const report: string[] = [];
    for (const probe of probes) {
      const { host, sim } = await open(entry);
      try {
        const swirlRate = (): number => sim.layer(screenToHw(0, 0), 2).fre;
        host.run(20);
        expect(
          swirlRate(),
          `arc: the swirl is turning before the ${probe.label} press`,
        ).toBeGreaterThan(0);
        host.touchDown(0, probe.x, probe.y);
        host.tick();
        host.touchUp(0, probe.x, probe.y);
        host.tick();
        const calibrated = calibratedCell(probe.x, probe.y);
        const naive = naiveCellOf(probe.x, probe.y);
        report.push(
          `  ${probe.label} (${probe.x},${probe.y}): N -> cell ${calibrated}, ` +
            `naive divisor -> cell ${naive}; swirl rate after the press ` +
            `${swirlRate()}`,
        );
        expect(calibrated, `arc: ${probe.label} is the calibrated centre`).toBe(
          40,
        );
        expect(
          swirlRate(),
          `arc: the press ${probe.label} did not stop the swirl - the stop ` +
            "test is not reading the calibrated centre",
        ).toBe(0);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        if (probe.label.startsWith("one past")) {
          expect(
            naive,
            "the off-centre probe is column 3 to the naive divisor, so the " +
              "old test would have let the swirl run",
          ).not.toBe(40);
        }
      } finally {
        host.close();
      }
    }
    process.stdout.write(
      "\nARC'S STOP THROUGH N (plan 12.1-03):\n" + report.join("\n") + "\n",
    );
  }, 60000);

  it("draws the finger on CHORUS, CONSOLE, MORPH and LUMEN in each entry's colour at nine LED centres and a midpoint, follows MORPH's and LUMEN's colour knobs, clears MORPH's on a lift before its early return and refuses its second finger, and leaves LUMEN's A byte-identical to 12-11", async () => {
    // PLAN 12.1-04. The four remaining hand-authored Setups that read a cell
    // now call `G(s,i,e,x,y,0,<colour>)` after `Q` and before their own early
    // return - white on CHORUS and CONSOLE (D-13), @TRAILC on MORPH, @CURSORC
    // on LUMEN. Layer 0 is the finger's alone on all four: the chessboard and
    // the bloom, the strips, the corners and the comet, the field and the
    // cursor cell are all on layers 1 and 2. Every coordinate is a knot from
    // calibration.ts, never a literal; every colour is read off the rendered
    // Setup's one G call, never a knob.
    const report: string[] = [];
    const midX = Math.floor((KX[4] + KX[5]) / 2);
    /** The four corners, the four edge midpoints, the centre: (c, r) pairs. */
    const NINE: readonly [number, number][] = [
      [0, 0],
      [8, 0],
      [0, 8],
      [8, 8],
      [4, 0],
      [0, 4],
      [8, 4],
      [4, 8],
      [4, 4],
    ];

    for (const id of ["chorus", "console", "morph", "lumen"]) {
      const entry = entryById(id);
      const colour = fingerColourOf(entry);
      const { host, sim } = await open(entry);
      try {
        expect(host.errors, `${id}: the Setup raised`).toEqual([]);
        expect(
          litOnLayer0(sim),
          `${id}: layer 0 at rest is dark - nothing but G writes it`,
        ).toEqual({});

        // 1. NINE LED CENTRES. Press dead on LED (c, r), read layer 0 while
        //    pressed, lift, read again: that one cell at 255 in the entry's
        //    colour and no other layer-0 cell above 0; dark again after.
        const marks: string[] = [];
        for (const [c, r] of NINE) {
          const cell = c + r * 9;
          host.touchDown(0, KX[c], KY[r]);
          host.tick();
          const got = litOnLayer0(sim);
          expect(
            got,
            `${id}: a press dead on LED (${c},${r}) at (${KX[c]},${KY[r]}) ` +
              "must light exactly its own cell at 255 on layer 0",
          ).toEqual({ [cell]: 255 });
          expect(
            colour0(sim, cell),
            `${id}: cell ${cell} is not in the entry's finger colour`,
          ).toEqual(colour);
          marks.push(`${cell}`);
          host.touchUp(0, KX[c], KY[r]);
          host.tick();
          expect(
            litOnLayer0(sim),
            `${id}: after the lift from LED (${c},${r}) layer 0 is not dark`,
          ).toEqual({});
        }
        expect(host.errors, `${id}: ${host.errors.join(" | ")}`).toEqual([]);

        // 2. THE MIDPOINT between LED 4 and 5 in x on row 4: exactly two
        //    layer-0 cells, 40 and 41, at the bilinear weights.
        host.touchDown(0, midX, KY[4]);
        host.tick();
        const pair = litOf(expectedFinger(midX, KY[4]).phases);
        expect(Object.keys(pair), "the midpoint is a pair").toHaveLength(2);
        const midGot = litOnLayer0(sim);
        expect(
          Object.keys(midGot),
          `${id}: the midpoint press lights exactly two layer-0 cells`,
        ).toHaveLength(2);
        expect(
          midGot,
          `${id}: the midpoint pair at the computed weights`,
        ).toEqual(pair);
        host.touchUp(0, midX, KY[4]);
        host.tick();
        expect(litOnLayer0(sim), `${id}: dark after the midpoint lift`).toEqual(
          {},
        );
        report.push(
          `  ${entry.name}: nine centres lit their own cell (${marks.join(" ")}) ` +
            `in ${colour.join(",")}; midpoint (${midX},${KY[4]}) lit ` +
            Object.entries(midGot)
              .map(([cell, p]) => `${cell}=${p}`)
              .join(" "),
        );

        // 3. MORPH: THE LIFT REACHES G, AND THE SECOND FINGER DOES NOT. Its
        //    callback returns early on an end code (`e==3 or e>=5 and e<9`)
        //    and for any contact but the first (`i>0`); `Q` and `G` sit in
        //    front of the end test and behind the single-contact rule, in
        //    that order (morph.ts, the four-point paragraph). So a lift with
        //    code 5 clears the block - through Q's E and again through G's
        //    own end branch - and a second contact pressed while the first is
        //    down draws nothing: `B[1]` is never set.
        if (id === "morph") {
          const cell = 2 + 3 * 9;
          host.touchDown(0, KX[2], KY[3]);
          host.tick();
          expect(litOnLayer0(sim), "morph: the press lights its LED").toEqual({
            [cell]: 255,
          });
          expect(host.globalSize("B"), "morph: G recorded the block").toBe(1);
          host.touchUp(0, KX[2], KY[3]);
          host.tick();
          expect(
            litOnLayer0(sim),
            "morph: a lift (code 5) left the finger lit - G is not reached " +
              "before the early return, and MORPH has no Timer to sweep it",
          ).toEqual({});
          expect(host.globalSize("B"), "morph: the block is forgotten").toBe(0);

          host.touchDown(0, KX[2], KY[3]);
          host.tick();
          const midiBefore = host.midi.length;
          host.touchDown(1, KX[6], KY[6]);
          host.tick();
          host.touchMove(1, KX[6] + 1, KY[6]);
          host.tick();
          expect(
            litOnLayer0(sim),
            "morph: a second contact drew a finger - the single-contact rule " +
              "no longer comes before G",
          ).toEqual({ [cell]: 255 });
          expect(
            host.globalSize("B"),
            "morph: the second contact recorded a block",
          ).toBe(1);
          expect(
            host.midi.length - midiBefore,
            "morph: the second contact spoke on the wire",
          ).toBe(0);
          host.touchUp(1, KX[6] + 1, KY[6]);
          host.tick();
          host.touchUp(0, KX[2], KY[3]);
          host.tick();
          expect(litOnLayer0(sim), "morph: dark after both lifts").toEqual({});
          report.push(
            "  MORPH: lift with code 5 -> layer 0 dark, B empty; a second " +
              "finger while the first is down -> nothing new lit, 0 MIDI",
          );
        }
        expect(host.errors, `${id}: ${host.errors.join(" | ")}`).toEqual([]);
      } finally {
        host.close();
      }
    }

    // 3b. THE FINGER FOLLOWS THE ENTRY'S OWN COLOUR KNOB (D-13): MORPH hands G
    //     @TRAILC and LUMEN @CURSORC, so turning that knob to a value that is
    //     NOT white must turn the layer-0 finger with it. Clause 1 reads the
    //     colour off the rendered Setup and cannot tell a knob token from a
    //     literal white at the defaults, where both render 255,255,255 on
    //     LUMEN; this clause renders the knob at a non-default, non-white
    //     index and reads the knob, so a G handed a literal in place of the
    //     token - or the default in place of the knob - reddens here.
    for (const [id, knobId] of [
      ["morph", "trailColour"],
      ["lumen", "cursor"],
    ] as const) {
      const entry = entryById(id);
      const knob = entry.knobs.find((k) => k.id === knobId);
      expect(knob, `${id} declares a ${knobId} knob`).toBeDefined();
      const shipped = entry.defaults[knobId] ?? knob!.default;
      const index = knob!.values.findIndex(
        (v, i) => v !== "255,255,255" && i !== shipped,
      );
      expect(
        index,
        `${id}: a non-white, non-default ${knobId} value exists`,
      ).not.toBe(-1);
      const want = knob!.values[index].split(",").map(Number);
      const { setup, timer } = renderLua(entry, { [knobId]: index });
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer: timer.trim() === "" ? undefined : timer,
      });
      try {
        host.touchDown(0, KX[5], KY[2]);
        host.tick();
        expect(
          litOnLayer0(sim),
          `${id}: the press at the ${knobId} index ${index} lights its LED`,
        ).toEqual({ [5 + 2 * 9]: 255 });
        expect(
          colour0(sim, 5 + 2 * 9),
          `${id}: the finger did not follow the ${knobId} knob to ` +
            `${want.join(",")} - G is not being handed the entry's own colour ` +
            "token (D-13)",
        ).toEqual(want);
        host.touchUp(0, KX[5], KY[2]);
        host.tick();
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        report.push(
          `  ${entry.name}: ${knobId} at index ${index} (${want.join(",")}) ` +
            `-> the finger reads ${colour0(sim, 5 + 2 * 9).join(",")} through ` +
            "the knob",
        );
      } finally {
        host.close();
      }
    }

    // 4. LUMEN'S `A` IS UNCHANGED (D-14): re-drive 12-11's own gesture from
    //    its test above - DOWN (60,60), MOVE (61,60), MOVE (61,62), MOVE
    //    (62,62) - and compare the axis-CC log byte for byte against a Setup
    //    that is NOTHING BUT the same `A` call, and against the four answers
    //    12-11 asserted: nothing on the DOWN, then [CC, 61], [CC+1, 127-62],
    //    [CC, 62]. Raw x and 127-y, on the raw sensor scale - so 0 and 127
    //    are reached a third of an LED inside the outer LEDs (the calibrated
    //    A the row 26 note costs at about +25 is not this phase's).
    {
      const entry = entryById("lumen");
      const CC = knobValueOf(entry, "cc");
      const CH = knobValueOf(entry, "channel");
      const GESTURE: readonly ["down" | "move", number, number][] = [
        ["down", 60, 60],
        ["move", 61, 60],
        ["move", 61, 62],
        ["move", 62, 62],
      ];
      const drive = (host: {
        touchDown: (id: number, x: number, y: number) => void;
        touchMove: (id: number, x: number, y: number) => void;
        tick: () => void;
        midi: readonly HostMidi[];
      }): [number, number, number][] => {
        for (const [kind, x, y] of GESTURE) {
          if (kind === "down") host.touchDown(0, x, y);
          else host.touchMove(0, x, y);
          host.tick();
        }
        return host.midi
          .filter((m) => m.cmd === 176 && (m.p1 === CC || m.p1 === CC + 1))
          .map((m) => [m.ch, m.p1, m.p2]);
      };
      const { host } = await open(entry);
      const bare = await createLuaHost({
        sim: new PadSim(blankPadState()),
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup:
          "--[[@cb]]self.touch_cb=function(s,i,e,x,y)" +
          `A(s,i,e,x,y,${CC},${CC + 1},${CH})end`,
        timer: undefined,
      });
      try {
        const lumenLog = drive(host);
        const bareLog = drive(bare);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
        expect(
          lumenLog,
          "lumen: the axis CC pair is not byte-identical to a bare A call - " +
            "something between Q, G and the end test moved what A sends",
        ).toEqual(bareLog);
        expect(
          lumenLog,
          "lumen: the axis CC pair is not what 12-11's test recorded for " +
            "the same raw coordinates",
        ).toEqual([
          [CH, CC, 61],
          [CH, CC + 1, 127 - 62],
          [CH, CC, 62],
        ]);
        report.push(
          `  LUMEN: A over 12-11's gesture -> ` +
            lumenLog.map(([, p1, p2]) => `cc${p1}=${p2}`).join(" ") +
            " on both the entry and a bare A; raw, uncalibrated (D-14)",
        );
      } finally {
        host.close();
        bare.close();
      }
    }

    process.stdout.write(
      "\nTHE GRADIENT ON CHORUS, CONSOLE, MORPH AND LUMEN (plan 12.1-04):\n" +
        report.join("\n") +
        "\n",
    );
  }, 120000);

  it("centres TRACKPAD's edge flash on the calibrated row and column, where the naive divisor was one off near the edge", async () => {
    // PLAN 12.1-04 (D-17). The Timer's two flash centres read
    // `(U(c[2]//8,KY)+32)//64` and `(U(c[1]//8,KX)+32)//64` in place of
    // `c*9//1024`. The finger sits dead on LED row 1 in hi-res - `KY[1]*8`,
    // because `txma(1023)` is the identity lerp at eight times the sensor
    // scale - and moves right; the right column must flash centred on row 1.
    // The naive divisor, computed here beside it, reads that same finger as
    // row 0: the one-row-off the bench saw near the edges. Then the same for
    // a column on an upward move at `KX[1]*8`.
    const entry = entryById("trackpad");
    const { setup, timer } = renderLua(entry);
    const reach = knobValueOf(entry, "reach");
    const naiveOf = (hiRes: number): number => Math.floor((hiRes * 9) / 1024);
    const phase1 = (sim: PadSim, cell: number): number =>
      sim.layer(hwOfCell(cell), 1).pha;
    const report: string[] = [];

    type Axis = {
      label: string;
      /** The finger's fixed hi-res coordinate on the axis the flash is centred on. */
      fixed: number;
      /** The LED index that coordinate is dead on. */
      led: number;
      /** The drag: start (x, y) and per-sample delta. */
      from: [number, number];
      delta: [number, number];
      /** The edge that flashes, as a cell reader: k along the edge -> cell. */
      edgeCell: (k: number) => number;
    };
    const axes: readonly Axis[] = [
      {
        label: "rightward at hi-res y = KY[1]*8",
        fixed: KY[1] * 8,
        led: 1,
        from: [200, KY[1] * 8],
        delta: [40, 0],
        edgeCell: (row) => 8 + row * 9,
      },
      {
        label: "upward at hi-res x = KX[1]*8",
        fixed: KX[1] * 8,
        led: 1,
        from: [KX[1] * 8, 800],
        delta: [0, -40],
        edgeCell: (col) => col,
      },
    ];

    for (const axis of axes) {
      const sim = new PadSim(blankPadState());
      const host = await createLuaHost({
        sim,
        system: TOUCH_LIBRARY,
        systemTimer: TOUCH_LIBRARY_TIMER,
        setup,
        timer,
      });
      try {
        expect(host.coordMax, "trackpad: ten-bit axes").toBe(1023);
        host.run(4);
        let [x, y] = axis.from;
        host.touchDown(0, x, y);
        host.run(2);
        // Eight samples two ticks apart, as 12-10 drives it; the Timer paints
        // the first surviving delta after the hold-off. Snapshot layer 1 the
        // first tick anything on it is lit.
        let snapshot: number[] | undefined;
        for (let i = 0; i < 8 && !snapshot; i += 1) {
          x += axis.delta[0];
          y += axis.delta[1];
          host.touchMove(0, x, y);
          for (let t = 0; t < 2 && !snapshot; t += 1) {
            host.tick();
            const lit = Array.from({ length: 81 }, (_, c) => phase1(sim, c));
            if (lit.some((p) => p > 0)) snapshot = lit;
          }
        }
        expect(snapshot, `trackpad: ${axis.label} lit nothing`).toBeDefined();
        const edge = Array.from(
          { length: 9 },
          (_, k) => snapshot![axis.edgeCell(k)],
        );
        const litK = edge.flatMap((p, k) => (p > 0 ? [k] : []));
        const brightest = edge.indexOf(Math.max(...edge));
        const offEdge = snapshot!.filter(
          (p, c) =>
            p > 0 &&
            !Array.from({ length: 9 }, (_, k) => axis.edgeCell(k)).includes(c),
        );
        // The expected centre is the knot's own LED index through the map -
        // `nearestLed(calibratedAxis(fixed // 8))` - and it is row/column 1
        // by construction, because KY[1] IS where LED 1 reads.
        const calibrated = nearestLed(
          calibratedAxis(Math.floor(axis.fixed / 8), axis.delta[0] ? "y" : "x"),
        );
        const naive = naiveOf(axis.fixed);
        const half = Math.floor(reach / 2);
        const expectedK = Array.from(
          new Set(
            Array.from({ length: reach }, (_, j) =>
              Math.min(Math.max(calibrated - half + j, 0), 8),
            ),
          ),
        );
        report.push(
          `  ${axis.label} (${axis.fixed}): edge phases ${edge.join(" ")} - ` +
            `brightest at ${brightest}, lit ${litK.join(",")}; through the map ` +
            `${calibrated}, naive ${axis.fixed}*9//1024 = ${naive}`,
        );
        expect(calibrated, `trackpad: the knot is LED ${axis.led}`).toBe(
          axis.led,
        );
        expect(
          brightest,
          `trackpad: ${axis.label} - the flash is not centred on row/column ` +
            `${axis.led}; the Timer is not reading the calibrated centre`,
        ).toBe(axis.led);
        expect(
          litK,
          `trackpad: ${axis.label} - the lit run along the edge`,
        ).toEqual(expectedK);
        expect(offEdge, `trackpad: ${axis.label} lit off the edge`).toEqual([]);
        expect(
          naive,
          "the naive divisor puts this finger a row/column early - the " +
            "bench's one-off near the edge; if it agreed there would be " +
            "nothing to prove here",
        ).not.toBe(calibrated);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    process.stdout.write(
      "\nTRACKPAD'S FLASH CENTRE THROUGH THE MAP (plan 12.1-04):\n" +
        report.join("\n") +
        "\n",
    );
  }, 60000);

  it("draws GHOST's live finger as the gradient in @RECC, lights the comet and the ghost on the LED through N, and erases on LED (8,8) but records on LED (7,7) where the naive divisor read cell 80", async () => {
    // PLAN 12.1-08a (12.1-CONTEXT D-26 item 1). GHOST's two cell sites moved
    // from `x*9//128+y*9//128*9` to the library's `N(x,y)` - the erase key in
    // the Setup's callback and the comet / ghost cell in the Timer - and the
    // callback gained `G(s,i,e,x,y,0,@RECC)` after the id gate. Four claims,
    // every expected cell computed from KX / KY and never typed:
    //
    //   1. THE KEY IS LED (8,8) AND NOTHING ELSE. With a recording present a
    //      press at (KX[8], KY[8]) erases; a press at (KX[7], KY[7]) - which
    //      the naive divisor read as cell 80, so a finger on LED (7,7) erased
    //      a playing loop - starts a new recording instead. The naive reading
    //      is computed beside the calibrated one and printed.
    //   2. THE COMET CELL IS THE LED. A press dead on every one of the 81 LED
    //      centres, one Timer tick: layer 1 holds exactly the pressed LED's
    //      cell (the comet, rate 250) and the red key at 80 (the pulse, which
    //      the Timer arms on the first tick after an onset because s.n > 0).
    //   3. THE GRADIENT. At the same centres layer 0 holds that cell at 255 in
    //      the rendered @RECC and nothing else; the midpoint between LED 4 and
    //      LED 5 lights exactly two cells at the TS twin's weights; a lift
    //      leaves layer 0 dark; a code-9 tap records one point and lights no
    //      gradient (G returns on a 9; 12.1-03).
    //   4. NOTHING ELSE MOVED. After a lift the ghost walks the recorded points
    //      on layer 2 at N of each stored raw pair - the same cells the comet
    //      lit - and the key pulses while s.n > 0.
    const entry = entryById("ghost");
    const recc = knobValueOf(entry, "recordColour");
    const colour = fingerColourOf(entry);
    expect(
      colour.join(","),
      "ghost: G's colour is the rendered @RECC, the recording colour knob",
    ).toBe(entry.knobs[0].values[recc]);
    const naiveCellOf = (x: number, y: number): number =>
      Math.floor((x * 9) / 128) + Math.floor((y * 9) / 128) * 9;
    const litOnLayer = (sim: PadSim, layer: 1 | 2): Record<number, number> => {
      const out: Record<number, number> = {};
      for (let cell = 0; cell < 81; cell += 1) {
        const p = sim.layer(hwOfCell(cell), layer).pha;
        if (p !== 0) out[cell] = p;
      }
      return out;
    };
    const KEY = 80;
    const report: string[] = [];

    const { host, sim } = await open(entry);
    try {
      const recorded = (): number => host.selfNumber("n") ?? -1;
      expect(host.errors, `ghost: the Setup raised: ${host.errors}`).toEqual(
        [],
      );
      host.run(RESIDUE_WARMUP);
      expect(litOnLayer0(sim), "ghost: layer 0 is dark at rest").toEqual({});

      // 1. THE KEY. A recording of several points, then the two presses.
      const record = (c: number, r: number, ticks: number): void => {
        host.touchDown(0, KX[c], KY[r]);
        host.run(ticks);
        host.touchUp(0, KX[c], KY[r]);
        host.run(2);
      };
      record(2, 2, 20);
      const before = recorded();
      expect(
        before,
        "ghost: the first recording holds several points",
      ).toBeGreaterThan(2);

      host.touchDown(0, KX[8], KY[8]);
      host.tick();
      expect(
        calibratedCell(KX[8], KY[8]),
        "the corner knot is cell 80 to N",
      ).toBe(KEY);
      expect(recorded(), "ghost: a press on LED (8,8) erases (s.n == 0)").toBe(
        0,
      );
      expect(
        armVector(sim, 1),
        "ghost: layer 1 is all phase 0 after the erase",
      ).toEqual(new Array(81).fill(0));
      expect(
        armVector(sim, 2),
        "ghost: layer 2 is all phase 0 after the erase",
      ).toEqual(new Array(81).fill(0));
      expect(
        litOnLayer0(sim),
        "ghost: the erasing finger itself is drawn on LED (8,8) while down",
      ).toEqual({ [KEY]: 255 });
      host.touchUp(0, KX[8], KY[8]);
      host.run(2);
      expect(
        litOnLayer0(sim),
        "ghost: layer 0 dark after the erase lift",
      ).toEqual({});
      expect(recorded(), "ghost: still nothing recorded after the lift").toBe(
        0,
      );

      record(2, 2, 20);
      expect(
        recorded(),
        "ghost: the second recording holds several points",
      ).toBeGreaterThan(2);
      const naive77 = naiveCellOf(KX[7], KY[7]);
      const calibrated77 = calibratedCell(KX[7], KY[7]);
      expect(
        naive77,
        `the naive divisor reads LED (7,7) at (${KX[7]},${KY[7]}) as the key - the defect`,
      ).toBe(KEY);
      expect(calibrated77, "N reads LED (7,7) as cell 70").toBe(7 + 7 * 9);
      host.touchDown(0, KX[7], KY[7]);
      host.tick();
      const after77 = recorded();
      expect(
        after77,
        "ghost: a press on LED (7,7) must NOT erase - a new recording starts",
      ).toBeGreaterThan(0);
      expect(
        after77,
        "ghost: the press on LED (7,7) REPLACED the recording rather than appending",
      ).toBeLessThanOrEqual(2);
      host.run(2);
      expect(
        litOnLayer(sim, 1)[calibrated77],
        "ghost: the comet of the LED (7,7) press is on cell 70",
      ).toBeGreaterThan(0);
      expect(
        litOnLayer(sim, 1)[KEY],
        "ghost: cell 80 is the key's pulse while s.n > 0 - and nothing erased",
      ).toBeGreaterThan(0);
      host.touchUp(0, KX[7], KY[7]);
      host.run(2);
      report.push(
        `  LED (8,8) at (${KX[8]},${KY[8]}): N -> cell ${calibratedCell(KX[8], KY[8])}, ` +
          `naive -> cell ${naiveCellOf(KX[8], KY[8])}; pressed with ${before} points recorded -> s.n 0`,
      );
      report.push(
        `  LED (7,7) at (${KX[7]},${KY[7]}): N -> cell ${calibrated77}, ` +
          `naive -> cell ${naive77} (THE FIXED DEFECT: the old test erased here); ` +
          `pressed with a recording present -> s.n ${after77}, a new recording`,
      );

      // 2 + 3 + 4. ALL 81 LED CENTRES: the gradient on layer 0, the comet on
      //    layer 1, the ghost on layer 2 after the lift.
      let differ = 0;
      const identity: string[] = [];
      for (let r = 0; r < 9; r += 1) {
        let row = "";
        for (let c = 0; c < 9; c += 1) {
          const cell = c + r * 9;
          const x = KX[c];
          const y = KY[r];
          if (naiveCellOf(x, y) !== cell) differ += 1;
          expect(calibratedCell(x, y), `N of the knot (${c},${r})`).toBe(cell);
          if (cell === KEY) {
            // The previous centre left a recording, so this press IS the
            // erase - the card's own rule ("a new drag cannot be started in
            // the corner without erasing first"). Erase, lift, then press
            // again on an empty pad, where the corner is an ordinary cell.
            host.touchDown(0, x, y);
            host.tick();
            expect(
              recorded(),
              "ghost: the corner press with a recording present erases",
            ).toBe(0);
            host.touchUp(0, x, y);
            host.run(3);
          }
          host.touchDown(0, x, y);
          host.run(3);
          const got0 = litOnLayer0(sim);
          expect(
            got0,
            `ghost: a press dead on LED (${c},${r}) at (${x},${y}) lights exactly its own cell at 255 on layer 0`,
          ).toEqual({ [cell]: 255 });
          expect(got0, "and that is the TS twin's picture").toEqual(
            litOf(expectedFinger(x, y).phases),
          );
          expect(
            colour0(sim, cell),
            `ghost: layer 0 at cell ${cell} is in @RECC`,
          ).toEqual(colour);
          const got1 = litOnLayer(sim, 1);
          expect(
            Object.keys(got1)
              .map(Number)
              .sort((a, b) => a - b),
            `ghost: layer 1 under a press on LED (${c},${r}) is the comet at ${cell} and the key at 80`,
          ).toEqual([...new Set([cell, KEY])].sort((a, b) => a - b));
          expect(
            sim.layer(hwOfCell(cell), 1).fre,
            `ghost: the comet at ${cell} decays at the house rate`,
          ).toBe(250);
          row += got0[cell] === 255 && got1[cell] > 0 ? "#" : ".";
          host.touchUp(0, x, y);
          host.run(3);
          expect(
            litOnLayer0(sim),
            `ghost: layer 0 is dark after the lift from LED (${c},${r})`,
          ).toEqual({});
          const got2 = litOnLayer(sim, 2);
          expect(
            Object.keys(got2).map(Number),
            `ghost: the ghost replays the LED (${c},${r}) point on layer 2 at N of the stored raw pair`,
          ).toEqual([cell]);
        }
        identity.push(row);
      }
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      expect(
        identity.join(""),
        "ghost: some LED centre did not light its own cell on both layers",
      ).toBe("#".repeat(81));
      expect(
        differ,
        "the naive divisor must disagree with N on at least one LED centre, or this test proves nothing",
      ).toBeGreaterThan(0);
      report.push(
        `  81 LED centres: gradient at 255 on layer 0, comet on layer 1 and ghost on layer 2 all on the LED's own cell; ` +
          `the naive divisor puts ${differ} of the 81 centres on a different cell`,
      );
      for (const row of identity) report.push(`    ${row}`);

      // 3b. THE MIDPOINT between LED 4 and LED 5 in x on row 4.
      const midX = KX[4] + Math.floor((KX[5] - KX[4]) / 2);
      host.touchDown(0, midX, KY[4]);
      host.run(3);
      const pair = litOf(expectedFinger(midX, KY[4]).phases);
      expect(Object.keys(pair), "the midpoint is a pair").toHaveLength(2);
      const midGot = litOnLayer0(sim);
      expect(
        Object.keys(midGot),
        "ghost: the midpoint press lights exactly two layer-0 cells",
      ).toHaveLength(2);
      expect(
        midGot,
        "ghost: the midpoint pair at the TS twin's weights",
      ).toEqual(pair);
      host.touchUp(0, midX, KY[4]);
      host.run(3);
      expect(litOnLayer0(sim), "ghost: dark after the midpoint lift").toEqual(
        {},
      );
      report.push(
        `  midpoint x=${midX} on row 4: layer 0 = ${JSON.stringify(midGot)} (cells 40 and 41 at the bilinear weights)`,
      );

      // 3c. A CODE-9 TAP on LED (2,2): one point recorded, no gradient, the
      //     ghost replays it on layer 2.
      host.touchTap(0, KX[2], KY[2]);
      host.tick();
      expect(recorded(), "ghost: a fast tap records exactly one point").toBe(1);
      expect(
        litOnLayer0(sim),
        "ghost: a code-9 tap draws no gradient (G returns on a 9)",
      ).toEqual({});
      host.run(3);
      expect(litOnLayer0(sim), "ghost: still dark after the tap").toEqual({});
      expect(
        Object.keys(litOnLayer(sim, 2)).map(Number),
        "ghost: the tapped point replays on layer 2 at its LED",
      ).toEqual([2 + 2 * 9]);

      // 3d. A SECOND FINGER draws nothing and records nothing. GHOST is
      //     single-pointer (`if i>0 then return end`, the library's rule 4 at
      //     entry level) and G sits AFTER that gate: with contact 0 down on
      //     LED (3,3), contact 1 on LED (5,5) leaves layer 0 holding contact
      //     0's cell alone and the recording untouched. G before the gate
      //     would draw every contact - this clause is what turns red then.
      host.touchDown(0, KX[3], KY[3]);
      host.run(3);
      const soloCount = recorded();
      expect(
        litOnLayer0(sim),
        "ghost: contact 0 on LED (3,3) is the one gradient",
      ).toEqual({ [3 + 3 * 9]: 255 });
      host.touchDown(1, KX[5], KY[5]);
      host.tick();
      expect(
        litOnLayer0(sim),
        "ghost: a second finger on LED (5,5) draws no gradient - G is behind the id gate",
      ).toEqual({ [3 + 3 * 9]: 255 });
      host.touchUp(1, KX[5], KY[5]);
      host.tick();
      expect(
        litOnLayer0(sim),
        "ghost: the second finger's lift clears nothing of the first's",
      ).toEqual({ [3 + 3 * 9]: 255 });
      expect(
        recorded(),
        "ghost: the second finger did not restart the recording",
      ).toBeGreaterThanOrEqual(soloCount);
      host.touchUp(0, KX[3], KY[3]);
      host.run(3);
      expect(
        litOnLayer0(sim),
        "ghost: dark after the first finger's lift",
      ).toEqual({});
      report.push(
        `  a second finger on LED (5,5) under contact 0 on LED (3,3): layer 0 held cell ${3 + 3 * 9} alone; s.n ${soloCount} -> ${recorded()}`,
      );

      // 4. A DRAG over three LEDs, lifted: the ghost's union over 200 ticks is
      //    exactly those three cells through N - where the naive divisor put
      //    LED (1,3) in column 0.
      const columns = [1, 4, 7];
      const row = 3;
      host.touchDown(0, KX[columns[0]], KY[row]);
      host.run(6);
      host.touchMove(0, KX[columns[1]], KY[row]);
      host.run(6);
      host.touchMove(0, KX[columns[2]], KY[row]);
      host.run(6);
      host.touchUp(0, KX[columns[2]], KY[row]);
      host.run(2);
      const seen = new Set<number>();
      let keyPulsed = false;
      for (let t = 0; t < 200; t += 1) {
        host.tick();
        for (const cell of Object.keys(litOnLayer(sim, 2)).map(Number))
          seen.add(cell);
        if (litOnLayer(sim, 1)[KEY] > 0) keyPulsed = true;
      }
      const wanted = columns.map((c) => calibratedCell(KX[c], KY[row]));
      const naiveWanted = columns.map((c) => naiveCellOf(KX[c], KY[row]));
      expect(
        [...seen].sort((a, b) => a - b),
        "ghost: the replay walks exactly the three LEDs the drag visited",
      ).toEqual(wanted);
      expect(keyPulsed, "ghost: the red key pulses while s.n > 0").toBe(true);
      expect(
        naiveWanted,
        "the naive divisor puts at least one of the three on another cell",
      ).not.toEqual(wanted);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      report.push(
        `  a drag over LEDs (${columns.join("|")},${row}): the ghost replays cells ${wanted.join(" ")} ` +
          `(the naive divisor would have lit ${naiveWanted.join(" ")}); the key pulsed`,
      );
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nGHOST UNDER N AND G (plan 12.1-08a):\n" + report.join("\n") + "\n",
    );
  }, 120000);

  it("stamps K's decaying finger on the measured knots at the twin's starts, leaves a zero-weight neighbour's own decay alone, colours the four cells only when handed a colour, and keeps G's picture across the revision", async () => {
    // PLAN 12.1-08b (12.1-CONTEXT D-26 item 2, D-27). `K(x,y,l,w,r,g,b)` is
    // the decaying bilinear stamp the vendored compiler emits for the comet
    // presets (`K(x,y,1,252)`) and PINWHEEL (`K(x,y,1,252,255-i*60,i*60,128)`)
    // when a state carries `touchLibrary`. Four claims, every expected cell
    // and start computed from KX / KY through calibratedAxis and never
    // typed:
    //
    //   1. THE STAMP IS THE TWIN'S. Dead on LED (4,4) one cell at 252 over 42
    //      ticks; midway between LED 4 and LED 5 in x two cells at 132/22 and
    //      114/19; the centre of four cells at 72/12, 60/10, 60/10, 48/8; the
    //      raw corner (127,127) cell 80 alone; and the bench case - a finger
    //      dead on LED (7,1) at (120,12), which the naive divisor read as cell
    //      8 - cell 16 alone at 252. Each start a multiple of 6 with timeout
    //      start/6, read back after one tick.
    //   2. A ZERO-WEIGHT CELL IS NOT WRITTEN. A stamp dead on LED (6,4) is
    //      decaying at cell 42; a second finger dead on LED (5,4) stamps cell
    //      41 at 252 and its block's other three cells (42, 50, 51) at weight
    //      0 - and cell 42 keeps its own phase and its own countdown. Without
    //      `if z>0` the second finger would write D(42,1,0) and cut the first
    //      finger's trail dead.
    //   3. THE COLOUR. A stamp handed (255,0,0) sets the four cells' stops to
    //      glcStops(255,0,0,true); a stamp handed none leaves the stops where
    //      they were (blank here; the comet's init loop colours them on the
    //      module).
    //   4. G ACROSS THE REVISION. `G` now runs through `Z` and `Y`; at the 81
    //      LED centres and the midpoint its layer-0 picture is still exactly
    //      the TS twin 12.1-02 wrote against the inline form.
    const naiveCellOf = (x: number, y: number): number =>
      Math.floor((x * 9) / 128) + Math.floor((y * 9) / 128) * 9;
    const W = 252;
    /** The stamp's cells and quantised starts, from the table - `K`'s twin. */
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
    /** Layer 1 read back one tick after a stamp: cell -> [start, timeout at write]. */
    const stampsOn = (sim: PadSim): Record<number, [number, number]> => {
      const out: Record<number, [number, number]> = {};
      for (let cell = 0; cell < 81; cell += 1) {
        const L = sim.layer(hwOfCell(cell), 1);
        if (L.fre === 0 && L.timeout === 0) continue;
        out[cell] = [(L.pha + 6) & 255, L.timeout + 1];
      }
      return out;
    };
    const twinAsRead = (
      expected: Record<number, number>,
    ): Record<number, [number, number]> =>
      Object.fromEntries(
        Object.entries(expected)
          .filter(([, z]) => z !== 6)
          .map(([cell, z]) => [cell, [z, z / 6]]),
      );
    const report: string[] = [];

    // Contact 0 stamps without a colour, contact 1 with red; G draws the
    // live finger on layer 0 for claim 4.
    const SETUP =
      "--[[@cb]]self.touch_cb=function(s,i,e,x,y)" +
      "if i==0 then K(x,y,1,252)else K(x,y,1,252,255,0,0)end " +
      "G(s,i,e,x,y,0,255,255,255)end";
    const { host, sim } = await openGradient(false, SETUP);
    try {
      expect(host.errors, `the library raised: ${host.errors}`).toEqual([]);
      const drain = (): void => {
        host.run(60);
        for (let cell = 0; cell < 81; cell += 1) {
          const L = sim.layer(hwOfCell(cell), 1);
          expect(
            [L.pha, L.fre, L.timeout],
            `cell ${cell} did not land on 0 after the decay`,
          ).toEqual([0, 0, 0]);
        }
      };

      // 1. THE STAMP IS THE TWIN'S, at the five readings.
      const midX = Math.floor((KX[4] + KX[5]) / 2);
      const midY = Math.floor((KY[4] + KY[5]) / 2);
      const readings: { x: number; y: number; label: string }[] = [
        { x: KX[4], y: KY[4], label: "dead on LED (4,4)" },
        { x: midX, y: KY[4], label: "midway between LED 4 and 5 in x" },
        { x: midX, y: midY, label: "the centre of four" },
        { x: 127, y: 127, label: "the raw corner (127,127)" },
        { x: KX[7], y: KY[1], label: "the bench case, dead on LED (7,1)" },
      ];
      for (const reading of readings) {
        host.touchDown(0, reading.x, reading.y);
        host.run(1);
        const expected = expectedStamp(reading.x, reading.y);
        const got = stampsOn(sim);
        expect(
          got,
          `K ${reading.label} at (${reading.x},${reading.y}): not the twin's cells and starts`,
        ).toEqual(twinAsRead(expected));
        for (const [cell, [start, timeout]] of Object.entries(got)) {
          expect(start % 6, `cell ${cell}'s start is not a multiple of 6`).toBe(
            0,
          );
          expect(timeout, `cell ${cell}'s timeout is not start/6`).toBe(
            start / 6,
          );
        }
        report.push(
          `  ${reading.label.padEnd(36)} (${String(reading.x).padStart(3)},${String(reading.y).padStart(3)}): ` +
            Object.entries(expected)
              .map(([cell, z]) => `${cell}=${z}/t${z / 6}`)
              .join(" ") +
            `   (naive comet: cell ${naiveCellOf(reading.x, reading.y)}=252/t42)`,
        );
        host.touchUp(0, reading.x, reading.y);
        drain();
      }
      expect(
        Object.keys(expectedStamp(KX[4], KY[4])),
        "dead on an LED is one cell",
      ).toEqual(["40"]);
      expect(expectedStamp(KX[4], KY[4])[40], "at the full start").toBe(W);
      expect(
        Object.keys(expectedStamp(midX, KY[4])),
        "the midpoint is a pair",
      ).toHaveLength(2);
      expect(
        Object.keys(expectedStamp(midX, midY)),
        "the centre of four is four",
      ).toHaveLength(4);
      expect(expectedStamp(KX[7], KY[1]), "LED (7,1) is cell 16 to K").toEqual({
        16: W,
      });
      expect(
        naiveCellOf(KX[7], KY[1]),
        "the naive divisor read LED (7,1) as cell 8 - the defect",
      ).toBe(8);

      // 2. A ZERO-WEIGHT CELL IS NOT WRITTEN.
      host.touchDown(0, KX[6], KY[4]);
      host.run(1);
      expect(stampsOn(sim), "the first finger stamps cell 42 alone").toEqual({
        42: [W, 42],
      });
      host.run(10);
      const trailing = sim.layer(hwOfCell(42), 1);
      expect(
        [trailing.pha, trailing.timeout],
        "cell 42 is eleven steps into its decay",
      ).toEqual([W - 6 * 11, 42 - 11]);
      host.touchDown(1, KX[5], KY[4]);
      host.run(1);
      const second = expectedStamp(KX[5], KY[4]);
      expect(second, "the second finger's block is cell 41 alone").toEqual({
        41: W,
      });
      const after = sim.layer(hwOfCell(42), 1);
      expect(
        [after.pha, after.fre, after.timeout],
        "cell 42 - weight 0 under the second finger - lost its own decay: " +
          "K wrote a zero stamp over a neighbour's trail",
      ).toEqual([W - 6 * 12, 250, 42 - 12]);
      expect(sim.layer(hwOfCell(41), 1).pha, "cell 41 stamped at 252").toBe(
        (W + 250) & 255,
      );
      for (const cell of [50, 51]) {
        const L = sim.layer(hwOfCell(cell), 1);
        expect(
          [L.pha, L.fre, L.timeout],
          `cell ${cell}, weight 0, was written`,
        ).toEqual([0, 0, 0]);
      }
      report.push(
        `  a finger dead on LED (5,4) beside a trail at cell 42: cell 42 kept phase ${after.pha}/t${after.timeout}, cells 50 and 51 untouched`,
      );
      host.touchUp(0, KX[6], KY[4]);
      host.touchUp(1, KX[5], KY[4]);
      drain();

      // 3. THE COLOUR. Contact 1 is handed red; contact 0 nothing.
      const red = glcStops(255, 0, 0, true);
      host.touchDown(1, midX, midY);
      host.run(1);
      const four = Object.keys(expectedStamp(midX, midY)).map(Number);
      expect(four, "the centre of four is four cells").toHaveLength(4);
      for (const cell of four) {
        const L = sim.layer(hwOfCell(cell), 1);
        expect(
          { min: [...L.min], mid: [...L.mid], max: [...L.max] },
          `cell ${cell}'s stops are not glcStops(255,0,0,true)`,
        ).toEqual(red);
      }
      host.touchUp(1, midX, midY);
      drain();
      host.touchDown(0, KX[2], KY[2]);
      host.run(1);
      expect(stampsOn(sim), "contact 0 stamps cell 20").toEqual({
        20: [W, 42],
      });
      const plain = sim.layer(hwOfCell(20), 1);
      expect(
        { min: [...plain.min], mid: [...plain.mid], max: [...plain.max] },
        "a stamp handed no colour changed the cell's stops",
      ).toEqual({ min: [0, 0, 0], mid: [0, 0, 0], max: [0, 0, 0] });
      // And the red cells kept their stops through the drain - a colour is
      // a keeper, the phase is what decays.
      for (const cell of four) {
        expect([...sim.layer(hwOfCell(cell), 1).max]).toEqual(red.max);
      }
      host.touchUp(0, KX[2], KY[2]);
      drain();
      report.push(
        `  K with (255,0,0) at the centre of four: cells ${four.join(" ")} at stops ${JSON.stringify(red)}; K without a colour at cell 20: stops untouched`,
      );

      // 4. G ACROSS THE REVISION: the live finger on layer 0 at all 81 LED
      //    centres and the midpoint is the TS twin's picture.
      let checked = 0;
      for (let r = 0; r < 9; r += 1) {
        for (let c = 0; c < 9; c += 1) {
          host.touchDown(0, KX[c], KY[r]);
          host.run(1);
          expect(
            litOnLayer0(sim),
            `G through Z and Y at LED (${c},${r}) is not the twin's picture`,
          ).toEqual(litOf(expectedFinger(KX[c], KY[r]).phases));
          expect(litOnLayer0(sim), "one cell at 255").toEqual({
            [c + r * 9]: 255,
          });
          host.touchUp(0, KX[c], KY[r]);
          host.run(1);
          expect(litOnLayer0(sim), "dark after the lift").toEqual({});
          checked += 1;
          host.run(60);
        }
      }
      host.touchDown(0, midX, KY[4]);
      host.run(1);
      expect(
        litOnLayer0(sim),
        "G through Z and Y at the midpoint is not the twin's pair",
      ).toEqual(litOf(expectedFinger(midX, KY[4]).phases));
      expect(Object.keys(litOnLayer0(sim)), "a pair").toHaveLength(2);
      host.touchUp(0, midX, KY[4]);
      host.run(1);
      expect(checked, "81 LED centres").toBe(81);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
      report.push(
        "  G through Z and Y: the twin's picture at all 81 LED centres and the midpoint, dark after every lift",
      );
    } finally {
      host.close();
    }
    process.stdout.write(
      "\nK ON THE MEASURED KNOTS (plan 12.1-08b):\n" + report.join("\n") + "\n",
    );
  }, 120000);
});

// ---------------------------------------------------------------------------
// SNAKE REMADE (change 14, 2026-09-21; BENCH-2026-09-16.txt section 14). The bench: "runs the same
// sequence over and over", the steer "turns the wrong way / late", the notes "hang or spam". The
// cases below drive the remade card through the shelf's first game (byte-identical to the one
// before the change), a calibrated steer that outlives the lift, a refused reversal, the note-off
// a generation after every note-on, the death's flash, pause and restart, and two games whose
// food walks differ.
// ---------------------------------------------------------------------------

describe("SNAKE remade (change 14)", () => {
  /**
   * The first game's note-ons on the tree BEFORE the change (HEAD 8878084, the
   * VM at the defaults, nobody touching): five bites and the death, by tick.
   * Pasted from a run of the old entry, so the remade card is held to the
   * OLD sequence and not to itself; `docs/entries/snake.md` carries the old
   * strings verbatim.
   */
  const PRE_CHANGE_FIRST_GAME: readonly {
    tick: number;
    p1: number;
    p2: number;
  }[] = [
    { tick: 22, p1: 51, p2: 100 },
    { tick: 110, p1: 52, p2: 100 },
    { tick: 308, p1: 53, p2: 100 },
    { tick: 550, p1: 54, p2: 100 },
    { tick: 594, p1: 55, p2: 100 },
    { tick: 638, p1: 36, p2: 110 },
  ];

  /** Every screen cell whose rendered colour is exactly `rgb`. */
  function cellsOf(frame: Uint8Array, rgb: string): number[] {
    const out: number[] = [];
    for (let cell = 0; cell < CELLS; cell += 1)
      if (rgbAt(frame, cell) === rgb) out.push(cell);
    return out;
  }

  it("keeps the pre-change first game on the shelf, releases every note a generation later, flashes and pauses on death, restarts, and seeds the next game's food differently", async () => {
    const entry = entryById("snake");
    const period = knobValueOf(entry, "speed") / 10;
    expect(period, "snake: the default step is a whole number of ticks").toBe(
      22,
    );
    const channel = knobValueOf(entry, "channel");
    const lowest = knobValueOf(entry, "note");
    const rendered = renderLua(entry);
    // Since change 17B the release reads the pending note's channel, off-status and number from a
    // triple (the Bite and the Death are two outputs); at the default Types the off is 144*3//2-88,
    // 128 - the wire below still reads it.
    expect(
      rendered.timer.includes("s:gms(z[1],z[2],z[3],0)") &&
        rendered.timer.includes(`{${channel},144*3//2-88,`),
      "snake: the Timer sends NOTE-OFF, status 128, through gms",
    ).toBe(true);
    // The walk, read off the entry: `(w*7+23+s.g)%81`, seeded per game.
    expect(rendered.setup, "snake: the seeded food walk").toContain(
      "w=(w*7+23+s.g)%81",
    );
    expect(rendered.setup, "snake: the calibrated touch cell").toContain(
      "N(x,y)",
    );
    expect(rendered.setup, "snake: no raw divisor").not.toContain("*9//128");

    const { host } = await open(entry);
    try {
      type Ev = { tick: number; cmd: number; p1: number; p2: number };
      const events: Ev[] = [];
      let seen = 0;
      let tick = 0;
      const run = (n: number): void => {
        for (let i = 0; i < n; i += 1) {
          host.tick();
          tick += 1;
          while (seen < host.midi.length) {
            const m = host.midi[seen];
            seen += 1;
            events.push({ tick, cmd: m.cmd, p1: m.p1, p2: m.p2 });
          }
        }
      };
      // The two colours as the engine renders them, sampled off the Setup's
      // own picture: the head at 40 and the food at 41.
      run(1);
      const snakeRgb = rgbAt(host.frame, 40);
      const foodRgb = rgbAt(host.frame, 41);
      expect(snakeRgb, "the head is lit").not.toBe("[0,0,0]");
      expect(foodRgb, "the food is lit").not.toBe("[0,0,0]");
      expect(foodRgb, "the two colours tell apart").not.toBe(snakeRgb);
      expect(cellsOf(host.frame, snakeRgb), "the two-cell snake").toEqual([
        39, 40,
      ]);
      expect(cellsOf(host.frame, foodRgb), "the food at 41").toEqual([41]);

      // THE FIRST GAME, to the death tick. Every note-on on the old tick with
      // the old pitch and velocity, and a note-off for it exactly one
      // generation later - nothing else on the wire.
      const deathTick =
        PRE_CHANGE_FIRST_GAME[PRE_CHANGE_FIRST_GAME.length - 1].tick;
      run(deathTick - tick);
      const expected: Ev[] = [];
      for (const on of PRE_CHANGE_FIRST_GAME) {
        expected.push({ tick: on.tick, cmd: 144, p1: on.p1, p2: on.p2 });
        if (on.tick + period <= deathTick)
          expected.push({
            tick: on.tick + period,
            cmd: 128,
            p1: on.p1,
            p2: 0,
          });
      }
      expected.sort((a, b) => a.tick - b.tick);
      expect(events, "the first game's wire").toEqual(expected);
      // The first bite placed the food by the unseeded walk from 41.
      const firstFood = (41 * 7 + 23) % 81;
      expect(firstFood).toBe(67);

      // THE DEATH TICK: the whole body (two cells plus five bites) and the food
      // in the food colour, nothing in the snake colour - the flash.
      const bodyLength = 2 + (PRE_CHANGE_FIRST_GAME.length - 1);
      expect(
        cellsOf(host.frame, foodRgb).length,
        "the flash: every body cell and the food in the food colour",
      ).toBe(bodyLength + 1);
      expect(cellsOf(host.frame, snakeRgb), "no snake-coloured cell").toEqual(
        [],
      );
      // Held for two more generations; the death note released on the first.
      run(period);
      expect(events.at(-1), "the death note released").toEqual({
        tick: deathTick + period,
        cmd: 128,
        p1: lowest - 12,
        p2: 0,
      });
      expect(cellsOf(host.frame, foodRgb).length, "still flashing").toBe(
        bodyLength + 1,
      );
      run(period);
      expect(cellsOf(host.frame, foodRgb).length, "still flashing").toBe(
        bodyLength + 1,
      );
      // The third generation blacks the board; two more stay dark.
      run(period);
      expect(lit(host.frame), "the board blacked").toBe(0);
      run(period * 2);
      expect(lit(host.frame), "still dark").toBe(0);
      const sentBeforeRestart = events.length;
      // The sixth restarts: the two-cell snake and the food at 41, no send.
      run(period);
      const restartTick = deathTick + 6 * period;
      expect(tick).toBe(restartTick);
      expect(cellsOf(host.frame, snakeRgb), "restarted").toEqual([39, 40]);
      expect(cellsOf(host.frame, foodRgb), "the food back at 41").toEqual([41]);
      expect(events.length, "nothing sent through the pause").toBe(
        sentBeforeRestart,
      );

      // THE SECOND GAME'S FIRST BITE, one generation on: the same pitch, and
      // the food placed by the walk seeded with the generation count at the
      // restart - a different cell from the first game's.
      run(period);
      expect(events.at(-1), "the second game's first bite").toEqual({
        tick: restartTick + period,
        cmd: 144,
        p1: lowest + 3,
        p2: 100,
      });
      const generationsAtRestart = restartTick / period;
      const secondFood = (41 * 7 + 23 + generationsAtRestart) % 81;
      expect(secondFood, "the seeded walk lands elsewhere").not.toBe(firstFood);
      expect(cellsOf(host.frame, foodRgb), "the second game's food").toEqual([
        secondFood,
      ]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  }, 60000);

  it("steers from the calibrated cell for as long as the finger is down, keeps the direction after the lift with the autopilot off, refuses a reversal, and turns right when told", async () => {
    const entry = entryById("snake");
    const period = knobValueOf(entry, "speed") / 10;
    const { host } = await open(entry);
    try {
      let tick = 0;
      const run = (n: number): void => {
        for (let i = 0; i < n; i += 1) {
          host.tick();
          tick += 1;
        }
      };
      run(1);
      const snakeRgb = rgbAt(host.frame, 40);
      const foodRgb = rgbAt(host.frame, 41);
      const snake = (): number[] => cellsOf(host.frame, snakeRgb);
      // A finger on LED (col, row) through the measured knots: the library's
      // `N` puts it on that cell, where the raw divisor would not near an edge.
      const at = (col: number, row: number): [number, number] => [
        ledCentre(col, "x"),
        ledCentre(row, "y"),
      ];

      // Generation 1: the snake eats the food at 41; the head is at column 5.
      run(period - tick);
      expect(snake(), "after the first bite").toEqual([39, 40, 41]);
      expect(
        cellsOf(host.frame, foodRgb),
        "the food moved off column 5's path",
      ).toEqual([67]);

      // A finger straight above the head (col 5, row 1): the dominant axis is
      // vertical, the snake is travelling horizontally, so it turns UP on the
      // next generation - not on a later one.
      host.touchDown(0, ...at(5, 1));
      run(1);
      run(period - (tick % period));
      expect(tick).toBe(2 * period);
      expect(snake(), "turned up on the very next generation").toEqual([
        32, 40, 41,
      ]);
      // The finger lifts. The direction outlives it: up, and up again, with
      // no autopilot pulling the snake toward the food's column.
      host.touchUp(0, ...at(5, 1));
      run(1);
      run(period - (tick % period));
      expect(snake(), "still up after the lift").toEqual([23, 32, 41]);
      run(period);
      expect(snake(), "and up again").toEqual([14, 23, 32]);

      // A reversal: a finger straight BELOW the head while travelling up is
      // the vertical axis again, and s.v is not 0, so it is refused.
      host.touchDown(0, ...at(5, 7));
      run(1);
      host.touchUp(0, ...at(5, 7));
      run(1);
      run(period - (tick % period));
      expect(snake(), "the reversal refused, still up").toEqual([5, 14, 23]);

      // A finger to the RIGHT of the head on its own row: horizontal, s.u is
      // 0, so the snake turns right on the next generation.
      host.touchDown(0, ...at(8, 0));
      run(1);
      host.touchUp(0, ...at(8, 0));
      run(1);
      run(period - (tick % period));
      expect(snake(), "turned right").toEqual([5, 6, 14]);
      run(period);
      expect(snake(), "and keeps right").toEqual([5, 6, 7]);
      // No bite on this path, so the wire carries the first bite's pair only.
      expect(
        host.midi.map((m) => [m.cmd, m.p1, m.p2]),
        "one note-on and its release",
      ).toEqual([
        [144, 51, 100],
        [128, 51, 0],
      ]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  }, 60000);
});

describe("ARC's MIDI output and MIDI RX (change 17, BENCH-2026-09-16.txt section 17)", () => {
  /** ARC opened at its defaults with some indices overridden, on the real library. */
  async function openArc(over: Record<string, number> = {}) {
    const entry = entryById("arc");
    const { setup, timer } = renderLua(entry, { ...entry.defaults, ...over });
    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup,
      timer,
    });
    return { entry, host, sim };
  }
  const index = (entry: CatalogEntry, id: string, literal: string): number => {
    const knob = entry.knobs.find((k) => k.id === id);
    const at = knob?.values.indexOf(literal) ?? -1;
    if (at < 0) throw new Error(`${entry.id}.${id} has no ${literal}`);
    return at;
  };
  /** Depth 0 (the finger at the bottom edge, x in column 2, clear of the stop cell): the LFO flat at its centre. */
  function flatten(host: Awaited<ReturnType<typeof openArc>>["host"]): void {
    host.touchDown(0, 40, host.coordMax);
    host.tick();
    host.touchUp(0, 40, host.coordMax);
    host.tick();
  }

  it("sends on the output's Type and Channel: a controller on its number, a pitch bend (0, then the value - 64 is the centre 8192), a channel pressure (the value, then 0); the defaults a controller on 16, channel 0 as before", async () => {
    const report: string[] = [];
    for (const [type, expectShape] of [
      ["176", (p1: number, p2: number) => p1 === 16 && p2 >= 0],
      ["224", (p1: number) => p1 === 0],
      ["208", (_p1: number, p2: number) => p2 === 0],
    ] as const) {
      const base = await openArc();
      const over = {
        midiType: index(base.entry, "midiType", type),
        channel: index(base.entry, "channel", "4"),
      };
      base.host.close();
      const { host } = await openArc(over);
      try {
        flatten(host);
        host.run(20);
        const sent = host.midi.filter((m) => m.cmd === Number(type));
        expect(sent.length, `type ${type}: sends`).toBeGreaterThan(10);
        expect(
          host.midi.every((m) => m.cmd === Number(type) && m.ch === 4),
        ).toBe(true);
        expect(
          sent.every((m) => expectShape(m.p1, m.p2)),
          `type ${type}: ${JSON.stringify(sent.slice(0, 3))}`,
        ).toBe(true);
        const last = sent[sent.length - 1];
        report.push(`type ${type} on channel 4: ${last.p1}, ${last.p2}`);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // At the defaults: a controller on 16, channel 0 - the wire ARC sent before change 17.
    const { host } = await openArc();
    try {
      host.run(5);
      expect(host.midi.length).toBeGreaterThan(0);
      expect(
        host.midi.every((m) => m.ch === 0 && m.cmd === 176 && m.p1 === 16),
      ).toBe(true);
    } finally {
      host.close();
    }
    process.stdout.write(`\nARC's output (change 17):\n${report.join("\n")}\n`);
  }, 60000);

  it("receives: the host's value on its type, channel and number sets the LFO's centre (the offset fader and its lit cell move; at depth 0 the value comes back exactly); its own value coming back, another channel, another number, a neighbour's traffic and Receive Off are ignored", async () => {
    const REPORT = 13;
    const { entry, host, sim } = await openArc();
    try {
      flatten(host);
      host.run(3);
      const lastSent = () => host.midi[host.midi.length - 1].p2;
      expect(lastSent(), "the centre at rest").toBe(64);
      expect(
        host.midiIn(REPORT, 0, 176, 16, 100),
        "the Timer made the callback",
      ).toBe(true);
      host.run(3);
      expect(lastSent(), "the received centre comes back at depth 0").toBe(100);
      // The offset fader's lit cell: s.u = ceil(27 * 512 / 127) = 109, row (109+32)//64 = 2.
      expect(sim.layer(screenToHw(8, 2), 1).pha).toBe(255);
      expect(sim.layer(screenToHw(8, 4), 1).pha).toBe(0);
      for (const v of [0, 1, 63, 64, 126, 127]) {
        host.midiIn(REPORT, 0, 176, 16, v);
        host.run(2);
        expect(lastSent(), `centre ${v}`).toBe(v);
      }
      // Ignored: its own last value, another channel, another number, a neighbour's EXECUTE.
      host.midiIn(REPORT, 0, 176, 16, 127);
      host.midiIn(REPORT, 1, 176, 16, 20);
      host.midiIn(REPORT, 0, 176, 17, 20);
      host.midiIn(14, 0, 176, 16, 20);
      host.run(2);
      expect(lastSent()).toBe(127);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
    // A pitch bend on channel 9 receives on its status (the value its second byte); a channel
    // pressure on its first byte.
    for (const [type, msg] of [
      ["224", [8, 224, 0, 90]],
      ["208", [8, 208, 90, 0]],
    ] as const) {
      const { host: h } = await openArc({
        midiType: index(entry, "midiType", type),
        channel: index(entry, "channel", "8"),
      });
      try {
        flatten(h);
        h.run(3);
        h.midiIn(REPORT, msg[0], msg[1], msg[2], msg[3]);
        h.run(3);
        const last = h.midi[h.midi.length - 1];
        expect(type === "224" ? last.p2 : last.p1, `type ${type}`).toBe(90);
      } finally {
        h.close();
      }
    }
    // Receive Off: the callback answers no header.
    const { host: off } = await openArc({
      midiReceive: index(entry, "midiReceive", "0"),
    });
    try {
      flatten(off);
      off.run(3);
      off.midiIn(REPORT, 0, 176, 16, 100);
      off.run(3);
      expect(off.midi[off.midi.length - 1].p2).toBe(64);
    } finally {
      off.close();
    }
  }, 60000);
});

describe("the hand-authored cards' MIDI outputs, MIDI RX and latch (change 17B, BENCH-2026-09-16.txt sections 17 and 18)", () => {
  /** The host's REPORT header: the traffic a receiving card answers. 14 is a neighbour's EXECUTE. */
  const REPORT = 13;
  /**
   * A previous landing's receive callback, installed before the card's Setup runs: a card that
   * assigns its own callback or nil leaves it unreachable, so a message reaching it fails the test.
   */
  const STALE =
    "self.midirx_cb=function()error('a previous landing answered')end ";
  /** A knob's index by its literal; a literal the knob does not offer fails the test. */
  const literalIndex = (
    entry: CatalogEntry,
    id: string,
    literal: string,
  ): number => {
    const at = entry.knobs.find((k) => k.id === id)?.values.indexOf(literal);
    if (at === undefined || at < 0)
      throw new Error(`${entry.id}.${id} has no ${literal}`);
    return at;
  };
  /** A card at its defaults with knobs moved BY LITERAL, on the real library; `stale` lands a previous callback first. */
  async function openCard(
    id: string,
    over: Record<string, string> = {},
    stale = false,
  ) {
    const entry = entryById(id);
    const indices: Record<string, number> = { ...entry.defaults };
    for (const [knob, literal] of Object.entries(over))
      indices[knob] = literalIndex(entry, knob, literal);
    const { setup, timer } = renderLua(entry, indices);
    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup: stale ? STALE + setup : setup,
      timer,
    });
    return { entry, host, sim };
  }
  /** Everything sent since `from`, as `ch:cmd:p1:p2`. */
  const wire = (midi: readonly HostMidi[], from = 0): string[] =>
    midi.slice(from).map((m) => `${m.ch}:${m.cmd}:${m.p1}:${m.p2}`);

  it("CHORUS: the Chord output sends its three numbers on its Type and Channel - a note-on and note-off, or a controller at the velocity and at 0 - exactly as before at the defaults; it receives nothing and clears a previous landing's callback; a finger keeps the pad it landed on", async () => {
    const entry = entryById("chorus");
    const velocity = knobValueOf(entry, "velocity");
    /** Chord pad z's centre on the measured map: column z%3*3+1, row 7-z//3*3. */
    const padXY = (z: number): [number, number] => [
      ledCentre((z % 3) * 3 + 1, "x"),
      ledCentre(7 - Math.floor(z / 3) * 3, "y"),
    ];
    const I = [48, 52, 55]; // C major's I at the default key, root position
    const ii = [50, 53, 57];
    for (const [type, channel, on, off] of [
      ["144", "0", 144, 128],
      ["176", "5", 176, 176],
    ] as const) {
      const { host } = await openCard(
        "chorus",
        { midiType: type, channel },
        true,
      );
      try {
        const [x, y] = padXY(0);
        host.touchDown(0, x, y);
        host.run(2);
        expect(wire(host.midi), `type ${type}: the I chord on`).toEqual(
          I.map((n) => `${channel}:${on}:${n}:${velocity}`),
        );
        // THE LATCH: the same finger slides onto pad ii and past it - nothing more is sent.
        const [x2, y2] = padXY(1);
        for (let k = 1; k <= 6; k++) {
          host.touchMove(0, x + ((x2 - x) * k) / 4, y);
          host.run(1);
        }
        host.touchMove(0, x2, y2);
        host.run(2);
        expect(wire(host.midi).length, "a slide re-chords nothing").toBe(3);
        host.touchUp(0, x2, y2);
        host.run(2);
        expect(wire(host.midi, 3), `type ${type}: the I chord off`).toEqual(
          I.map((n) => `${channel}:${off}:${n}:0`),
        );
        // A second press on pad ii still plays ii.
        host.touchDown(1, x2, y2);
        host.run(2);
        expect(wire(host.midi, 6)).toEqual(
          ii.map((n) => `${channel}:${on}:${n}:${velocity}`),
        );
        // NO RECEIVE: the Setup assigned nil over the previous landing's callback.
        expect(host.midiIn(REPORT, Number(channel), on, 48, 100)).toBe(false);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("CONSOLE: the Faders output sends each fader on its Type - a controller from the first number (wrapping past 127), a pitch bend or channel pressure per fader on its own channel from the first - and exactly as before at the defaults; it receives a fader's level and repaints it, sends nothing back, ignores the rest; a finger keeps the fader it landed on and the cap swipe stays", async () => {
    /** Fader c's lit body cells on layer 1 - its level. */
    const level = (sim: PadSim, c: number): number => {
      let n = 0;
      for (let r = 1; r <= 8; r++)
        if (sim.layer(hwOfCell(r * 9 + c), 1).pha === 255) n++;
      return n;
    };
    /** One contact down on (column, row), moved through `path`, then up. */
    const drag = (
      host: Awaited<ReturnType<typeof openCard>>["host"],
      path: readonly (readonly [number, number])[],
    ): void => {
      const at = ([c, r]: readonly [number, number]) =>
        [ledCentre(c, "x"), ledCentre(r, "y")] as const;
      host.touchDown(0, ...at(path[0]));
      host.tick();
      for (const p of path.slice(1)) {
        host.touchMove(0, ...at(p));
        host.tick();
      }
      host.touchUp(0, ...at(path[path.length - 1]));
      host.tick();
    };
    // THE DEFAULTS: fader 3 to the top sends controller 19 on channel 0, as before.
    {
      const { host, sim } = await openCard("console", {}, true);
      try {
        // The receive callback is the Timer body PULLED IN by the Setup: no Timer is armed.
        expect(host.timerArmed, "the pull-in arms nothing").toBe(false);
        host.run(2);
        drag(host, [
          [3, 8],
          [3, 4],
          [3, 1],
        ]);
        expect(wire(host.midi)).toEqual([
          "0:176:19:0",
          "0:176:19:72",
          "0:176:19:127",
        ]);
        expect(level(sim, 3)).toBe(7);
        // THE LATCH: land on fader 5 at row 6, slide across onto fader 7 and down - only fader 5
        // moves; fader 7 keeps its 4. The cap row reached by a fader finger is its top.
        const from = host.midi.length;
        drag(host, [
          [5, 6],
          [6, 6],
          [7, 6],
          [7, 3],
          [7, 0],
        ]);
        expect(wire(host.midi, from)).toEqual([
          "0:176:21:36",
          "0:176:21:90",
          "0:176:21:127",
        ]);
        expect([level(sim, 5), level(sim, 7)]).toEqual([7, 4]);
        // RX: the host's controller 18 at 54 sets fader 2 to 3 and sends nothing; the stale
        // callback is gone (the Timer made CONSOLE's own).
        const quiet = host.midi.length;
        expect(host.midiIn(REPORT, 0, 176, 18, 54)).toBe(true);
        expect(level(sim, 2)).toBe(3);
        for (const [instr, ch, cmd, p1, p2] of [
          [14, 0, 176, 18, 127], // a neighbour's
          [REPORT, 1, 176, 18, 127], // another channel
          [REPORT, 0, 176, 25, 127], // past the ninth fader
          [REPORT, 0, 224, 0, 127], // another type
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(level(sim, 2)).toBe(3);
        expect(host.midiIn(REPORT, 0, 176, 16, 127)).toBe(true);
        expect(level(sim, 0), "every step round trips").toBe(7);
        expect(host.midi.length, "nothing is echoed").toBe(quiet);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // A PITCH BEND and A CHANNEL PRESSURE per fader from channel 5 (wire 4); a CC bank from 120
    // wraps its ninth fader to 0; each receives on its own shape.
    for (const [type, cc, sent, rx] of [
      ["224", "16", "7:224:0:127", [7, 224, 0, 18]],
      ["208", "16", "7:208:127:0", [7, 208, 18, 0]],
      ["176", "120", "4:176:0:127", [4, 176, 123, 18]],
    ] as const) {
      const { host, sim } = await openCard("console", {
        midiType: type,
        channel: "4",
        cc,
      });
      try {
        host.run(2);
        drag(host, [
          [type === "176" ? 8 : 3, 8],
          [type === "176" ? 8 : 3, 1],
        ]);
        expect(wire(host.midi).at(-1), `type ${type}`).toBe(sent);
        expect(host.midiIn(REPORT, rx[0], rx[1], rx[2], rx[3])).toBe(true);
        expect(level(sim, 3), `type ${type}: fader 3 received 18`).toBe(1);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // RECEIVE OFF: the callback answers no header.
    const { host, sim } = await openCard("console", { midiReceive: "0" });
    try {
      host.run(2);
      host.midiIn(REPORT, 0, 176, 18, 127);
      expect(level(sim, 2)).toBe(4);
    } finally {
      host.close();
    }
  }, 60000);

  it("CULL: no MIDI to send or receive - the Setup assigns midirx_cb=nil over a previous landing's, the keystroke unchanged; a tap is onset-only, so a slide rates nothing (already latched)", async () => {
    const { host } = await openCard("cull", {}, true);
    try {
      // A tap on the top band sends its key; a finger that then slides down across the bands
      // sends nothing more.
      const x = ledCentre(4, "x");
      host.touchDown(0, x, ledCentre(0, "y"));
      host.tick();
      for (let r = 1; r <= 8; r++) {
        host.touchMove(0, x, ledCentre(r, "y"));
        host.tick();
      }
      host.touchUp(0, x, ledCentre(8, "y"));
      host.tick();
      expect(host.hid.length, "one keystroke for one press").toBe(1);
      expect(host.midi).toEqual([]);
      expect(host.midiIn(REPORT, 0, 176, 16, 100), "no callback").toBe(false);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  }, 60000);

  it("GHOST: the X and Y axes are two outputs, each on its own Type, Channel and Number - at the defaults the pair it always sent (16 and 17 on channel 0) - and it receives nothing, clearing a previous landing's callback", async () => {
    // The raw pair (40, 90): X sends 40 and Y 127 - 90 = 37, every tick, X first.
    for (const [over, x, y] of [
      [{}, "0:176:16:40", "0:176:17:37"],
      [
        { xType: "224", channel: "3", yType: "208", yChannel: "6" },
        "3:224:0:40",
        "6:208:37:0",
      ],
      [{ yCc: "40", yChannel: "9" }, "0:176:16:40", "9:176:40:37"],
    ] as const) {
      const { host } = await openCard("ghost", over, true);
      try {
        host.touchDown(0, 40, 90);
        host.run(6);
        host.touchUp(0, 40, 90);
        host.run(6);
        const sent = wire(host.midi);
        expect(sent.length, JSON.stringify(over)).toBeGreaterThan(4);
        for (let at = 0; at + 1 < sent.length; at += 2)
          expect([sent[at], sent[at + 1]], JSON.stringify(over)).toEqual([
            x,
            y,
          ]);
        expect(host.midiIn(REPORT, 0, 176, 16, 5), "no callback").toBe(false);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("LUMEN: the Hue and Depth outputs each send on their own Type, Channel and Number - at the defaults the pair A sent - and each receives: a host value moves the cursor to the colour it picks, sends nothing back, ignores the rest; the receive is pulled in, no Timer armed", async () => {
    /** The cursor: the one cell whose layer-1 colour is the cursor white. */
    const cursor = (sim: PadSim): number[] => {
      const out: number[] = [];
      for (let n = 0; n < 81; n++) {
        const max = sim.layer(hwOfCell(n), 1).max;
        if (max[0] === 255 && max[1] === 255 && max[2] === 255) out.push(n);
      }
      return out;
    };
    const gesture = (host: Awaited<ReturnType<typeof openCard>>["host"]) => {
      host.touchDown(0, 60, 60);
      host.tick();
      host.touchMove(0, 61, 60);
      host.tick();
      host.touchMove(0, 61, 62);
      host.tick();
    };
    {
      const { host, sim } = await openCard("lumen", {}, true);
      try {
        expect(host.timerArmed, "the pull-in arms nothing").toBe(false);
        gesture(host);
        expect(wire(host.midi)).toEqual(["0:176:16:61", "0:176:17:65"]);
        const sent = host.midi.length;
        const sysex = host.sysex.length;
        // RX: Hue 0 puts the cursor on the left; Depth 0 (y = 127) on the bottom row; Hue 127 right.
        expect(host.midiIn(REPORT, 0, 176, 16, 0)).toBe(true);
        const row = Math.floor(cursor(sim)[0] / 9);
        expect(cursor(sim)).toEqual([row * 9]);
        host.midiIn(REPORT, 0, 176, 17, 0);
        expect(cursor(sim)).toEqual([72]);
        host.midiIn(REPORT, 0, 176, 16, 127);
        expect(cursor(sim)).toEqual([80]);
        // Ignored: another channel, another number, a neighbour, another type.
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 1, 176, 16, 0],
          [REPORT, 0, 176, 18, 0],
          [14, 0, 176, 16, 0],
          [REPORT, 0, 224, 0, 0],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(cursor(sim)).toEqual([80]);
        expect(host.midi.length, "nothing sent back").toBe(sent);
        expect(host.sysex.length, "no sysex sent back").toBe(sysex);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // Hue a pitch bend on wire channel 2, Depth a controller 40 on 5; each received on its shape.
    {
      const { host, sim } = await openCard("lumen", {
        xType: "224",
        channel: "2",
        yCc: "40",
        yChannel: "5",
      });
      try {
        gesture(host);
        expect(wire(host.midi)).toEqual(["2:224:0:61", "5:176:40:65"]);
        host.midiIn(REPORT, 2, 224, 0, 127);
        host.midiIn(REPORT, 5, 176, 40, 0);
        expect(cursor(sim)).toEqual([80]);
      } finally {
        host.close();
      }
    }
    // Receive Off on Hue: its messages move nothing; Depth still receives.
    {
      const { host, sim } = await openCard("lumen", { xReceive: "0" });
      try {
        host.midiIn(REPORT, 0, 176, 16, 127);
        expect(cursor(sim)).toEqual([]);
        host.midiIn(REPORT, 0, 176, 17, 0);
        expect(cursor(sim)).toEqual([72]);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("MORPH: the four corners are four outputs, each on its own Type, Channel and Number - at the defaults 16..19 on channel 0 as before - and each receives: a host value lights its corner block and is the value held until the next touch, nothing sent back; the receive is pulled in, no Timer armed", async () => {
    /** Corner j's block phase on layer 1 (its origin cell, s.k: 0, 6, 54, 60). */
    const block = (sim: PadSim, j: number): number =>
      sim.layer(hwOfCell([0, 6, 54, 60][j - 1]), 1).pha;
    {
      const { host, sim } = await openCard("morph", {}, true);
      try {
        expect(host.timerArmed, "the pull-in arms nothing").toBe(false);
        // A finger dead in the top-left corner: corner 1 at 127, the others 0 - on 16..19.
        host.touchDown(0, 0, 0);
        host.tick();
        expect(wire(host.midi)).toEqual(["0:176:16:127"]);
        host.touchUp(0, 0, 0);
        host.tick();
        const sent = host.midi.length;
        // RX: the host's CC 19 (the bottom-right corner) at 100 lights its block at 200; nothing back.
        expect(host.midiIn(REPORT, 0, 176, 19, 100)).toBe(true);
        expect(block(sim, 4)).toBe(200);
        // Ignored: another channel, a number no corner has, a neighbour's, another type.
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 1, 176, 19, 10],
          [REPORT, 0, 176, 20, 10],
          [14, 0, 176, 19, 10],
          [REPORT, 0, 224, 0, 10],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(block(sim, 4)).toBe(200);
        expect(host.midi.length, "nothing sent back").toBe(sent);
        // The next touch takes the corner back from the finger: bottom-right at 127.
        host.touchDown(0, 127, 127);
        host.tick();
        expect(wire(host.midi, sent)).toContain("0:176:19:127");
        expect(block(sim, 4)).toBe(254);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // The top-right corner a pitch bend on wire channel 4, the bottom-left a controller 40 on 7.
    {
      const { host, sim } = await openCard("morph", {
        type2: "224",
        ch2: "4",
        cc3: "40",
        ch3: "7",
      });
      try {
        host.touchDown(0, 127, 0);
        host.tick();
        expect(wire(host.midi)).toEqual(["4:224:0:127"]);
        host.touchUp(0, 127, 0);
        host.tick();
        host.touchDown(0, 0, 127);
        host.tick();
        // A press inside a corner block speaks for that corner alone (the corner tap).
        expect(wire(host.midi).slice(1)).toEqual(["7:176:40:127"]);
        host.midiIn(REPORT, 4, 224, 0, 64);
        expect(block(sim, 2)).toBe(128);
        host.midiIn(REPORT, 7, 176, 40, 10);
        expect(block(sim, 3)).toBe(20);
      } finally {
        host.close();
      }
    }
    // The top-left corner's Receive Off: its messages light nothing.
    {
      const { host, sim } = await openCard("morph", { rx1: "0" });
      try {
        host.midiIn(REPORT, 0, 176, 16, 100);
        expect(block(sim, 1)).toBe(0);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("ORBIT: each ring is an output on its own Type (Note or CC), Channel and Number - at the defaults every step's note-off and a set step's note-on on channel 0 as before - and each receives: a note-on of the ring's arms its step at the playhead and lights the marker, never clears one, so its own notes echoed back change nothing; a swipe arming every cell it crosses is by design", async () => {
    /** Ring d's step t's pad cell, the Setup's own rotation. */
    const cellOf = (d: number, t: number): number => {
      let [a, b] = [d, (t % (d * 2)) - d];
      for (let j = 0; j < Math.floor(t / (d * 2)); j++) [a, b] = [-b, a];
      return a + 4 + (b + 4) * 9;
    };
    const marker = (sim: PadSim, d: number, t: number): number =>
      sim.layer(hwOfCell(cellOf(d, t)), 1).pha;
    {
      const { host, sim } = await openCard("orbit", {}, true);
      try {
        // The Setup assigned nil over the previous landing's callback; the Timer makes ORBIT's own.
        expect(host.midiIn(REPORT, 0, 144, 36, 100)).toBe(false);
        host.run(40);
        expect(host.midi.length).toBeGreaterThan(0);
        expect(
          host.midi.every(
            (m) => m.ch === 0 && (m.cmd === 128 || m.cmd === 144),
          ),
          "the defaults: note-offs and note-ons on channel 0",
        ).toBe(true);
        // Step the rings until ring 1's last-played step is unset, then play its note.
        let t = -1;
        for (let n = 0; n < 200 && t < 0; n++) {
          host.tick();
          const k = host.selfNumber("k") ?? 0;
          const at = (((k - 1) % 8) + 8) % 8;
          if (marker(sim, 1, at) === 0) t = at;
        }
        expect(t, "an unset step on ring 1").toBeGreaterThanOrEqual(0);
        const sent = host.midi.length;
        // Mismatches first: a note-off, velocity 0, another channel, a neighbour, another note.
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 0, 128, 36, 64],
          [REPORT, 0, 144, 36, 0],
          [REPORT, 1, 144, 36, 100],
          [14, 0, 144, 36, 100],
          [REPORT, 0, 144, 37, 100],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(marker(sim, 1, t)).toBe(0);
        expect(host.midiIn(REPORT, 0, 144, 36, 100)).toBe(true);
        expect(marker(sim, 1, t), "the step is armed at the playhead").toBe(
          255,
        );
        expect(host.midi.length, "nothing sent back").toBe(sent);
        // Its own note echoed back re-arms nothing new and clears nothing.
        host.midiIn(REPORT, 0, 144, 36, 100);
        expect(marker(sim, 1, t)).toBe(255);
        // Eight steps later ring 1 plays the armed step: its note-on is on the wire.
        host.run(8 * 2 * 8);
        expect(wire(host.midi, sent)).toContain("0:144:36:100");
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // Ring 2 as a controller on wire channel 4: its gate is the controller at 0, then 100 on a set
    // step; a received controller above 0 arms. Ring 3's Receive Off.
    {
      const { host, sim } = await openCard("orbit", {
        type2: "176",
        channel2: "4",
        receive3: "0",
      });
      const ring3 = () =>
        Array.from({ length: 24 }, (_, t) => marker(sim, 3, t)).join(",");
      try {
        host.run(60);
        const ring2 = wire(host.midi).filter((m) => m.startsWith("4:"));
        expect(ring2.length).toBeGreaterThan(0);
        expect(
          ring2.every((m) => m === "4:176:38:0" || m === "4:176:38:100"),
          ring2.slice(0, 4).join(" "),
        ).toBe(true);
        expect(ring2).toContain("4:176:38:100");
        expect(host.midiIn(REPORT, 4, 176, 38, 1)).toBe(true);
        // At a moment ring 3's playhead step is unset, its note arms nothing: Receive Off.
        let unset = false;
        for (let n = 0; n < 200 && !unset; n++) {
          host.tick();
          const k = host.selfNumber("k") ?? 0;
          unset = marker(sim, 3, (((k - 1) % 24) + 24) % 24) === 0;
        }
        expect(unset).toBe(true);
        const before = ring3();
        host.midiIn(REPORT, 0, 144, 42, 100);
        expect(ring3(), "ring 3 with Receive Off arms nothing").toBe(before);
        expect(host.errors).toEqual([]);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("POMODORO: the Transport and Alarm outputs each send on their own Type, Channel and Number - at the defaults 48 on a tap and 60 at zero on channel 0 as before - and neither receives (the Setup assigns nil); a tap is onset-only, so a slide does nothing more (already latched)", async () => {
    const tap = (host: Awaited<ReturnType<typeof openCard>>["host"]) => {
      host.touchDown(0, 64, 64);
      host.tick();
      // A slide across the field sends nothing more: the handler acts on the onset alone.
      host.touchMove(0, 30, 90);
      host.tick();
      host.touchUp(0, 30, 90);
      host.tick();
    };
    for (const [over, transport, alarm] of [
      [
        { mins: "1" },
        ["0:144:48:90", "0:128:48:0"],
        ["0:144:60:110", "0:128:60:0"],
      ],
      [
        {
          mins: "1",
          transportType: "176",
          transportChannel: "3",
          transportNote: "20",
          alarmType: "176",
          channel: "9",
          note: "72",
        },
        ["3:176:20:90", "3:176:20:0"],
        ["9:176:72:110", "9:176:72:0"],
      ],
    ] as const) {
      const { host } = await openCard("pomodoro", over, true);
      try {
        // The card runs from its Setup: a tap pauses it, a second resumes - two transport pairs.
        tap(host);
        tap(host);
        expect(wire(host.midi), JSON.stringify(over)).toEqual([
          ...transport,
          ...transport,
        ]);
        // One minute at a Timer call a second: the alarm, once.
        host.run(62 * 100);
        expect(wire(host.midi, 4)).toEqual([...alarm]);
        expect(host.midiIn(REPORT, 0, 144, 48, 100), "no callback").toBe(false);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("QUADRANT: the four quadrants are four outputs, each on its own Type, Channel and Number - at the defaults 48..51 on channel 0 as before - and each receives: a host note-on lights its quadrant and its off darkens it, nothing sent back; a finger keeps the quadrant it pressed (already latched); the receive is pulled in, no Timer armed", async () => {
    /** Quadrant q's first cell's layer-1 phase (B's origin: q%2*5 + q//2*5*9). */
    const lit = (sim: PadSim, q: number): number =>
      sim.layer(hwOfCell((q % 2) * 5 + Math.floor(q / 2) * 45), 1).pha;
    const XY = [
      [20, 20],
      [100, 20],
      [20, 100],
      [100, 100],
    ] as const;
    {
      const { host, sim } = await openCard("quadrant", {}, true);
      try {
        expect(host.timerArmed, "the pull-in arms nothing").toBe(false);
        // Press the top-left, slide across into the top-right and lift: 48 alone.
        host.touchDown(0, ...XY[0]);
        host.tick();
        host.touchMove(0, 60, 20);
        host.tick();
        host.touchMove(0, ...XY[1]);
        host.tick();
        host.touchUp(0, ...XY[1]);
        host.tick();
        expect(wire(host.midi)).toEqual(["0:144:48:100", "0:128:48:0"]);
        host.touchDown(1, ...XY[3]);
        host.tick();
        host.touchUp(1, ...XY[3]);
        host.tick();
        expect(wire(host.midi, 2)).toEqual(["0:144:51:100", "0:128:51:0"]);
        const sent = host.midi.length;
        // RX: note 50 lights the bottom-left; its note-off darkens it; nothing is sent back.
        expect(host.midiIn(REPORT, 0, 144, 50, 90)).toBe(true);
        expect(lit(sim, 2)).toBe(255);
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 1, 128, 50, 0],
          [14, 0, 128, 50, 0],
          [REPORT, 0, 176, 50, 0],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(lit(sim, 2), "mismatches leave it lit").toBe(255);
        host.midiIn(REPORT, 0, 128, 50, 0);
        expect(lit(sim, 2)).toBe(0);
        host.midiIn(REPORT, 0, 144, 49, 100);
        host.midiIn(REPORT, 0, 144, 49, 0);
        expect(lit(sim, 1), "a note-on at 0 is an off").toBe(0);
        expect(host.midi.length, "nothing sent back").toBe(sent);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // The top-right a controller 20 on wire channel 3; the bottom-right's Receive Off.
    {
      const { host, sim } = await openCard("quadrant", {
        type2: "176",
        channel2: "3",
        note2: "20",
        receive4: "0",
      });
      try {
        host.touchDown(0, ...XY[1]);
        host.tick();
        host.touchUp(0, ...XY[1]);
        host.tick();
        expect(wire(host.midi)).toEqual(["3:176:20:100", "3:176:20:0"]);
        host.midiIn(REPORT, 3, 176, 20, 127);
        expect(lit(sim, 1)).toBe(255);
        host.midiIn(REPORT, 0, 144, 51, 100);
        expect(lit(sim, 3), "Receive Off").toBe(0);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("RADAR POINTS: the Points output sends every armed point on its Type and Channel - at the defaults a note-on as the ring crosses and its note-off a step later on channel 0, as before - and receives: a note-on arms ONE point of its direction on the ring just crossed and lights it, never clears one, so its own notes echoed back change nothing; a swipe arming every cell it crosses is by design", async () => {
    let east = -1;
    for (const [over, on, off] of [
      [{}, "0:144:", "0:128:"],
      [{ midiType: "176", channel: "6" }, "6:176:", "6:176:"],
    ] as const) {
      const { host } = await openCard("radar-points", over, true);
      try {
        // The Setup assigned nil over the previous landing's callback; the Timer makes its own.
        expect(
          host.midiIn(REPORT, 0, 144, 60, 100),
          "nil until the Timer",
        ).toBe(false);
        // Arm ring 1's east cell (41) with a tap on its LED.
        host.touchDown(0, ledCentre(5, "x"), ledCentre(4, "y"));
        host.tick();
        host.touchUp(0, ledCentre(5, "x"), ledCentre(4, "y"));
        host.tick();
        host.run(400);
        const sent = wire(host.midi);
        const ons = sent.filter((m) => m.startsWith(on) && !m.endsWith(":0"));
        const offs = sent.filter((m) => m.startsWith(off) && m.endsWith(":0"));
        expect(ons.length, JSON.stringify(over)).toBeGreaterThan(0);
        expect(offs.length, "every note-on is released").toBe(ons.length);
        expect(
          sent.every((m) => m.startsWith(on) || m.startsWith(off)),
          sent.slice(0, 4).join(" "),
        ).toBe(true);
        east = Number(ons[0].split(":")[2]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // RX: a fresh card; when ring 1 was the last crossed, the east point's pitch arms cell 41.
    const lit = (sim: PadSim, n: number): number =>
      sim.layer(hwOfCell(n), 1).pha;
    const armed = (sim: PadSim): number =>
      Array.from({ length: 81 }, (_, n) => n).filter((n) => lit(sim, n) === 255)
        .length;
    {
      const { host, sim } = await openCard("radar-points");
      try {
        let ring = -1;
        for (let n = 0; n < 400 && ring !== 1; n++) {
          host.tick();
          const k = host.selfNumber("k");
          ring = k === undefined ? -1 : (((k - 1) % 8) + 8) % 8;
        }
        expect(ring).toBe(1);
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 0, 128, east, 64],
          [REPORT, 0, 144, east, 0],
          [REPORT, 1, 144, east, 100],
          [14, 0, 144, east, 100],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(armed(sim), "mismatches arm nothing").toBe(0);
        const quiet = host.midi.length;
        expect(host.midiIn(REPORT, 0, 144, east, 100)).toBe(true);
        expect(lit(sim, 41), "the east point of ring 1").toBe(255);
        expect(armed(sim), "one point").toBe(1);
        host.midiIn(REPORT, 0, 144, east, 100);
        expect(armed(sim), "the echo arms nothing more").toBe(1);
        expect(host.midi.length, "nothing sent back").toBe(quiet);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // Receive Off.
    {
      const { host, sim } = await openCard("radar-points", {
        midiReceive: "0",
      });
      try {
        for (let n = 0; n < 60; n++) {
          host.tick();
          host.midiIn(REPORT, 0, 144, east, 100);
        }
        expect(armed(sim)).toBe(0);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("RADAR: the X and Y axes are two outputs, each on its own Type, Channel and Number - at the defaults 16 and 17 on channel 0, the preset's pair - and each receives: a host value draws the comet at the held pair, nothing sent back; the receive is made by the Timer body the Setup pulls in once", async () => {
    /** Layer-1 cells lit - the comet. */
    const comet = (sim: PadSim): number => {
      let n = 0;
      for (let c = 0; c < 81; c++) if (sim.layer(hwOfCell(c), 1).pha > 0) n++;
      return n;
    };
    {
      const { host, sim } = await openCard("radar", {}, true);
      try {
        host.touchDown(0, 40, 90);
        host.tick();
        expect(wire(host.midi)).toEqual(["0:176:16:40", "0:176:17:90"]);
        host.touchUp(0, 40, 90);
        host.run(100);
        const sent = host.midi.length;
        const before = comet(sim);
        expect(host.midiIn(REPORT, 0, 176, 16, 120)).toBe(true);
        host.midiIn(REPORT, 0, 176, 17, 10);
        expect(comet(sim), "a comet at the received pair").toBeGreaterThan(
          before,
        );
        expect(host.midi.length, "nothing sent back").toBe(sent);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      const { host, sim } = await openCard("radar", {
        xType: "224",
        channel: "4",
        yType: "208",
        yChannel: "7",
        yReceive: "0",
      });
      try {
        host.touchDown(0, 40, 90);
        host.tick();
        expect(wire(host.midi)).toEqual(["4:224:0:40", "7:208:90:0"]);
        host.touchUp(0, 40, 90);
        host.run(100);
        const before = comet(sim);
        host.midiIn(REPORT, 7, 208, 10, 0);
        expect(comet(sim), "Y's Receive Off draws nothing").toBe(before);
        host.midiIn(REPORT, 4, 224, 0, 120);
        expect(comet(sim)).toBeGreaterThan(before);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("SNAKE: the Bite and Death outputs each send on their own Type, Channel and Number - at the defaults the first game's notes on channel 0 as before - each released a generation later on its own output; neither receives (the Setup assigns nil); one control, the steer", async () => {
    const { host } = await openCard(
      "snake",
      {
        midiType: "176",
        channel: "5",
        note: "60",
        deathChannel: "9",
        deathNote: "40",
      },
      true,
    );
    try {
      // Nobody touching: the autopilot plays the first game - bites, then a death.
      host.run(900);
      const sent = wire(host.midi);
      const bites = sent.filter(
        (m) => m.startsWith("5:176:") && m.endsWith(":100"),
      );
      expect(bites.length, "bites on controller 60 + length").toBeGreaterThan(
        2,
      );
      expect(bites[0]).toBe("5:176:63:100");
      for (const b of bites)
        expect(sent, `${b} is released`).toContain(b.replace(/:100$/, ":0"));
      expect(sent).toContain("9:144:40:110");
      expect(sent).toContain("9:128:40:0");
      expect(
        sent.every((m) => m.startsWith("5:176:") || m.startsWith("9:1")),
        sent.slice(0, 6).join(" "),
      ).toBe(true);
      expect(host.midiIn(REPORT, 5, 176, 63, 100), "no callback").toBe(false);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  }, 60000);

  it("SONAR: the Sequence output sends every armed cell on its Type and Channel - at the defaults notes on channel 0 as before - and receives: a note-on arms ONE cell of its ring on the sweep line and lights it, never clears one, so its own notes echoed back change nothing; a swipe arming every cell it crosses is by design", async () => {
    const ring = (n: number): number =>
      Math.max(Math.abs((n % 9) - 4), Math.abs(Math.floor(n / 9) - 4));
    const armed = (sim: PadSim): number[] =>
      Array.from({ length: 81 }, (_, n) => n).filter(
        (n) => sim.layer(hwOfCell(n), 1).pha === 255,
      );
    {
      const { host, sim } = await openCard("sonar", {}, true);
      try {
        // The Setup assigned nil over the previous landing's callback; the Timer makes SONAR's own.
        expect(host.midiIn(REPORT, 0, 144, 41, 100)).toBe(false);
        host.run(10);
        // Ring 2's pitch at the defaults: root 36 + the minor pentatonic's third degree, 5.
        const pitch = 36 + 5;
        const sent = host.midi.length;
        // Mismatches: a note-off, velocity 0, another channel, a neighbour, another pitch.
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 0, 128, pitch, 64],
          [REPORT, 0, 144, pitch, 0],
          [REPORT, 1, 144, pitch, 100],
          [14, 0, 144, pitch, 100],
          [REPORT, 0, 144, pitch + 1, 100],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(armed(sim)).toEqual([]);
        // Step the sweep until one call arms a cell: exactly one, on ring 2, just swept.
        let got: number[] = [];
        for (let n = 0; n < 200 && got.length === 0; n++) {
          host.tick();
          expect(host.midiIn(REPORT, 0, 144, pitch, 100)).toBe(true);
          got = armed(sim);
        }
        expect(got.length, "one cell per note").toBe(1);
        expect(ring(got[0])).toBe(2);
        expect(
          sim.layer(hwOfCell(got[0]), 2).pha,
          "on the sweep line",
        ).toBeGreaterThan(0);
        // The echo of its own note arms nothing more, and a receive sends nothing.
        const quiet = host.midi.length;
        host.midiIn(REPORT, 0, 144, pitch, 100);
        expect(armed(sim)).toEqual(got);
        expect(host.midi.length, "nothing sent back").toBe(quiet);
        // A revolution later the armed cell plays: its pitch on channel 0.
        host.run(2 * 16 * 7 + 20);
        expect(wire(host.midi, sent)).toContain(`0:144:${pitch}:100`);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // CC on wire channel 3: an armed cell sends its pitch as a controller at 100, then 0; Receive Off.
    {
      const { host, sim } = await openCard("sonar", {
        midiType: "176",
        channel: "3",
        midiReceive: "0",
      });
      try {
        host.touchDown(0, ledCentre(6, "x"), ledCentre(4, "y"));
        host.tick();
        host.touchUp(0, ledCentre(6, "x"), ledCentre(4, "y"));
        host.tick();
        host.run(2 * 16 * 7 + 20);
        const sent = wire(host.midi);
        expect(sent.length).toBeGreaterThan(0);
        expect(
          sent.every((m) => m.startsWith("3:176:")),
          sent.slice(0, 3).join(" "),
        ).toBe(true);
        expect(sent.some((m) => m.endsWith(":100"))).toBe(true);
        const before = armed(sim).length;
        for (let n = 0; n < 40; n++) {
          host.tick();
          host.midiIn(REPORT, 3, 176, 41, 100);
        }
        expect(armed(sim).length, "Receive Off arms nothing").toBe(before);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("STAGE: no MIDI to send or receive - the Setup assigns midirx_cb=nil over a previous landing's, the keystroke unchanged; a slide lines a zone up and never cuts (already latched)", async () => {
    const { host } = await openCard("stage", {}, true);
    try {
      // A press on zone 4 cuts with one keystroke; a slide across onto zone 5 lines it up and
      // sends nothing more.
      host.touchDown(0, 64, 64);
      host.tick();
      host.touchMove(0, 110, 64);
      host.tick();
      host.touchUp(0, 110, 64);
      host.tick();
      expect(host.hid.length, "one keystroke for one press").toBe(1);
      expect(host.midi).toEqual([]);
      expect(host.midiIn(REPORT, 0, 176, 16, 100), "no callback").toBe(false);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  }, 60000);

  it("STEPS: each track is an output on its own Type (Note or CC), Channel and Number - at the defaults the bottom row's 43 on channel 10 (wire 9) as before - and each receives: a note-on arms the track's step at the playhead and lights it, never clears one, so its own notes echoed back change nothing; a swipe arming every cell it crosses is by design", async () => {
    /** Row r's step c: its pad cell's layer-2 phase (255 armed). */
    const step = (sim: PadSim, r: number, c: number): number =>
      sim.layer(hwOfCell(c + r * 9), 2).pha;
    {
      const { host, sim } = await openCard("steps", {}, true);
      try {
        expect(
          host.midiIn(REPORT, 9, 144, 38, 100),
          "nil until the Timer",
        ).toBe(false);
        host.run(60);
        const played = wire(host.midi);
        expect(played).toContain("9:144:43:100");
        expect(played).toContain("9:128:43:0");
        expect(
          played.every(
            (m) => m.startsWith("9:144:43:") || m.startsWith("9:128:43:"),
          ),
        ).toBe(true);
        // Track 3 (row 2, note 38): nothing armed there by default. Arm it at the playhead.
        const k = host.selfNumber("k") ?? 0;
        const c = (((k - 1) % 8) + 8) % 8;
        expect(step(sim, 2, c)).toBe(0);
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 9, 128, 38, 64],
          [REPORT, 9, 144, 38, 0],
          [REPORT, 8, 144, 38, 100],
          [14, 9, 144, 38, 100],
          [REPORT, 9, 144, 39, 100],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(step(sim, 2, c), "five mismatches arm nothing").toBe(0);
        const quiet = host.midi.length;
        expect(host.midiIn(REPORT, 9, 144, 38, 100)).toBe(true);
        expect(step(sim, 2, c), "armed at the playhead").toBe(255);
        expect(host.midi.length, "nothing sent back").toBe(quiet);
        host.midiIn(REPORT, 9, 144, 38, 100);
        expect(step(sim, 2, c), "the echo changes nothing").toBe(255);
        host.run(8 * 12 + 10);
        expect(wire(host.midi, quiet)).toContain("9:144:38:100");
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // Track 8 (the default pattern's row) as controller 50 on wire channel 4; track 3 Receive Off.
    {
      const { host, sim } = await openCard("steps", {
        type8: "176",
        channel8: "4",
        note8: "50",
        receive3: "0",
      });
      try {
        host.run(60);
        const played = wire(host.midi);
        expect(played).toContain("4:176:50:100");
        expect(played).toContain("4:176:50:0");
        const k = host.selfNumber("k") ?? 0;
        const c = (((k - 1) % 8) + 8) % 8;
        host.midiIn(REPORT, 9, 144, 38, 100);
        expect(step(sim, 2, c), "Receive Off").toBe(0);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("STRIP: the Fader and Crossfader are two outputs, each on its own Type, Channel and Number - at the defaults 1 and 2 on channel 0 as before - and each receives: a host value moves the control and its light, nothing sent back; a contact keeps the control it landed on (already latched); the receive is pulled in, no Timer armed", async () => {
    const BAR = [0, 200, 255];
    /** The fader's lit cells: its colour on layer 1 in rows 0..7. */
    const bar = (sim: PadSim): number => {
      let n = 0;
      for (let c = 0; c < 72; c++) {
        const max = sim.layer(hwOfCell(c), 1).max;
        if (max[0] === BAR[0] && max[1] === BAR[1] && max[2] === BAR[2]) n++;
      }
      return n;
    };
    /** The crossfader's lit cell on row 8 (phase 255, the rest 51). */
    const cross = (sim: PadSim): number =>
      [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
        (c) => sim.layer(hwOfCell(72 + c), 1).pha === 255,
      ) ?? -1;
    {
      const { host, sim } = await openCard("strip", {}, true);
      try {
        expect(host.timerArmed, "the pull-in arms nothing").toBe(false);
        expect(bar(sim), "the fader at rest").toBe(36);
        // The fader: a finger landing in the body and sliding down onto the crossfader row keeps
        // driving the fader (the latch the card already had).
        host.touchDown(0, 500, 100);
        host.tick();
        host.touchMove(0, 500, 1000);
        host.tick();
        host.touchUp(0, 500, 1000);
        host.tick();
        const sent = wire(host.midi);
        expect(
          sent.every((m) => m.startsWith("0:176:1:")),
          sent.join(" "),
        ).toBe(true);
        host.touchDown(1, 900, 1000);
        host.tick();
        host.touchUp(1, 900, 1000);
        host.tick();
        expect(wire(host.midi).at(-1)).toBe("0:176:2:112");
        const quiet = host.midi.length;
        // RX: the fader at 127 lights 72 cells (k = 8); the crossfader at 0 its first cell.
        expect(host.midiIn(REPORT, 0, 176, 1, 127)).toBe(true);
        expect(bar(sim)).toBe(72);
        host.midiIn(REPORT, 0, 176, 2, 0);
        expect(cross(sim)).toBe(0);
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 1, 176, 1, 0],
          [14, 0, 176, 1, 0],
          [REPORT, 0, 176, 3, 0],
          [REPORT, 0, 224, 0, 0],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(bar(sim), "mismatches leave it").toBe(72);
        expect(host.midi.length, "nothing sent back").toBe(quiet);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // The fader a pitch bend on wire channel 3, the crossfader a pressure on 5; the crossfader's
    // Receive Off.
    {
      const { host, sim } = await openCard("strip", {
        faderType: "224",
        channel: "3",
        crossType: "208",
        crossChannel: "5",
        crossReceive: "0",
      });
      try {
        host.touchDown(0, 500, 100);
        host.tick();
        host.touchUp(0, 500, 100);
        host.tick();
        host.touchDown(1, 900, 1000);
        host.tick();
        host.touchUp(1, 900, 1000);
        host.tick();
        const sent = wire(host.midi);
        expect(sent[0].startsWith("3:224:0:")).toBe(true);
        expect(sent.at(-1)).toBe("5:208:112:0");
        host.midiIn(REPORT, 3, 224, 0, 0);
        expect(bar(sim)).toBe(0);
        host.midiIn(REPORT, 5, 208, 0, 0);
        expect(cross(sim), "Receive Off").toBe(7);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("TRACKPAD COMET: no MIDI to send or receive - the Timer assigns midirx_cb=nil over a previous landing's on its first call (the Setup, byte for byte TRACKPAD's, has 5 free), the mouse unchanged; one control, the pad", async () => {
    const { host } = await openCard("trackpad-comet", {}, true);
    try {
      host.run(3);
      expect(host.midiIn(REPORT, 0, 176, 16, 100), "no callback").toBe(false);
      host.touchDown(0, 400, 400);
      host.run(2);
      host.touchMove(0, 500, 450);
      host.run(2);
      host.touchUp(0, 500, 450);
      host.run(4);
      expect(host.hid.length, "the pointer moved").toBeGreaterThan(0);
      expect(host.midi).toEqual([]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  }, 60000);

  it("TRACKPAD: no MIDI to send or receive - the Timer assigns midirx_cb=nil over a previous landing's on its first call (the Setup has 5 free), the mouse unchanged; one control, the pad", async () => {
    const { host } = await openCard("trackpad", {}, true);
    try {
      host.run(3);
      expect(host.midiIn(REPORT, 0, 176, 16, 100), "no callback").toBe(false);
      host.touchDown(0, 400, 400);
      host.run(2);
      host.touchMove(0, 500, 450);
      host.run(2);
      host.touchUp(0, 500, 450);
      host.run(4);
      expect(host.hid.length, "the pointer moved").toBeGreaterThan(0);
      expect(host.midi).toEqual([]);
      expect(host.errors, host.errors.join(" | ")).toEqual([]);
    } finally {
      host.close();
    }
  }, 60000);

  it("WHEELS: the Pitch and Mod wheels are two outputs, each on its own Type, Channel and Number - at the defaults the fourteen-bit bend and controller 1 on channel 0 as before - and each receives: a host value moves the wheel's light and holds until the next touch (the spring does not run), nothing sent back; a contact keeps its wheel (already latched); the receive is pulled in, no Timer armed", async () => {
    /** The pitch wheel's lit row (column 0, phase 255), and the mod bar's lit rows (column 8). */
    const pitchRow = (sim: PadSim): number =>
      [0, 1, 2, 3, 4, 5, 6, 7, 8].find(
        (r) => sim.layer(hwOfCell(r * 9), 1).pha === 255,
      ) ?? -1;
    const modBar = (sim: PadSim): number =>
      [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(
        (r) => sim.layer(hwOfCell(r * 9 + 8), 1).pha === 255,
      ).length;
    {
      const { host, sim } = await openCard("wheels", {}, true);
      try {
        expect(host.timerArmed, "the pull-in arms nothing").toBe(false);
        expect(pitchRow(sim), "the wheel at rest").toBe(4);
        const quiet = host.midi.length;
        // RX: a full bend up (lsb 0, msb 127) puts the marker on the top row and it stays.
        expect(host.midiIn(REPORT, 0, 224, 0, 127)).toBe(true);
        expect(pitchRow(sim)).toBe(0);
        host.run(50);
        expect(pitchRow(sim), "no spring on a received bend").toBe(0);
        host.midiIn(REPORT, 0, 176, 1, 127);
        expect(modBar(sim)).toBe(9);
        for (const [instr, ch, cmd, p1, p2] of [
          [REPORT, 1, 176, 1, 0],
          [14, 0, 176, 1, 0],
          [REPORT, 0, 176, 2, 0],
        ] as const)
          host.midiIn(instr, ch, cmd, p1, p2);
        expect(modBar(sim), "mismatches leave it").toBe(9);
        expect(host.midi.length, "nothing sent back").toBe(quiet);
        // The next touch takes the pitch wheel back and springs it home on the wire.
        host.touchDown(0, 100, 500);
        host.tick();
        host.touchUp(0, 100, 500);
        host.run(200);
        expect(wire(host.midi).at(-1), "home at 8192").toBe("0:224:0:64");
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    // The pitch wheel as controller 30 on wire channel 2 (the top seven bits), the mod wheel as a
    // pressure on 5; the pitch wheel's Receive Off.
    {
      const { host, sim } = await openCard("wheels", {
        pitchType: "176",
        pitchChannel: "2",
        pitchCc: "30",
        modType: "208",
        channel: "5",
        pitchReceive: "0",
      });
      try {
        host.touchDown(0, 100, 0);
        host.tick();
        expect(wire(host.midi)[0]).toBe("2:176:30:127");
        host.touchDown(1, 900, 0);
        host.tick();
        expect(wire(host.midi).at(-1)).toBe("5:208:127:0");
        host.touchUp(0, 100, 0);
        host.touchUp(1, 900, 0);
        host.run(200);
        host.midiIn(REPORT, 2, 176, 30, 0);
        expect(pitchRow(sim), "Receive Off").toBe(4);
        host.midiIn(REPORT, 5, 208, 0, 0);
        expect(modBar(sim)).toBe(0);
      } finally {
        host.close();
      }
    }
  }, 60000);
});

describe("the ported presets' MIDI outputs, MIDI RX and latch (change 17C, BENCH-2026-09-16.txt sections 17 and 18)", () => {
  /** The host's REPORT header: the traffic a receiving card answers. 14 is a neighbour's EXECUTE. */
  const REPORT = 13;
  /** A previous landing's receive callback: a card that assigns its own or nil leaves it unreachable. */
  const STALE =
    "self.midirx_cb=function()error('a previous landing answered')end ";
  /** An output knob's index by its literal; a literal the knob does not offer fails the test. */
  const literalIndex = (
    entry: CatalogEntry,
    id: string,
    literal: string,
  ): number => {
    const at = entry.knobs.find((k) => k.id === id)?.values.indexOf(literal);
    if (at === undefined || at < 0)
      throw new Error(`${entry.id}.${id} has no ${literal}`);
    return at;
  };
  /**
   * A WRAPPED preset (ported-midi.ts) at its shelf state with output knobs moved BY LITERAL - the
   * compiled pair through presetWire, exactly what the tuner lands - or, `raw`, the compiled pair
   * as the shelf ships it, on the real library.
   */
  async function openPreset(
    id: string,
    over: Record<string, string> = {},
    options: {
      stale?: boolean;
      raw?: boolean;
      /** Compiler knobs moved BY INDEX (knobs.preset.ts), the rest at the shelf's state. */
      tuned?: Record<string, number>;
    } = {},
  ) {
    const entry = entryById(id);
    const indices: Record<string, number> = { ...entry.defaults };
    for (const [knob, literal] of Object.entries(over))
      indices[knob] = literalIndex(entry, knob, literal);
    let state = resetAll(entry);
    if (options.tuned !== undefined) {
      state = baseStateFor(entry);
      for (const knob of compilerKnobs(entry))
        state = knob.apply(state, options.tuned[knob.id] ?? knob.default);
    }
    const compiled = compile(state);
    const { setupLua, timerLua } = options.raw
      ? compiled
      : presetWire(entry, compiled, indices);
    const sim = new PadSim(blankPadState());
    const host = await createLuaHost({
      sim,
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup: options.stale ? STALE + setupLua : setupLua,
      timer: timerLua,
    });
    return { entry, host, sim };
  }
  /** Everything sent since `from`, as `ch:cmd:p1:p2`. */
  const wire = (midi: readonly HostMidi[], from = 0): string[] =>
    midi.slice(from).map((m) => `${m.ch}:${m.cmd}:${m.p1}:${m.p2}`);
  /**
   * A full clockwise turn at radius 45 around the centre from twelve o'clock, in eighteen steps - the
   * DIAL's gesture (outside its dead zone), and one more drag for every other card.
   */
  const TURN: readonly (readonly [number, number])[] = Array.from(
    { length: 19 },
    (_, k) => {
      const a = Math.PI / 2 - (k * 2 * Math.PI) / 18;
      return [
        Math.round(64 + 45 * Math.cos(a)),
        Math.round(64 + 45 * Math.sin(a)),
      ] as const;
    },
  );
  /** One gesture, the same on every card: a press, a drag, a lift, a turn, a fast tap; the frames after each step. */
  function gesture(
    host: Awaited<ReturnType<typeof openPreset>>["host"],
  ): string[] {
    const frames: string[] = [];
    const snap = () => frames.push(Array.from(host.frame).join(","));
    host.touchDown(0, 20, 30);
    host.run(2);
    snap();
    for (const [x, y] of [
      [40, 50],
      [70, 60],
      [100, 90],
      [120, 110],
    ]) {
      host.touchMove(0, x, y);
      host.run(2);
      snap();
    }
    host.touchUp(0, 120, 110);
    host.run(30);
    snap();
    host.touchDown(0, TURN[0][0], TURN[0][1]);
    host.run(2);
    for (const [x, y] of TURN.slice(1)) {
      host.touchMove(0, x, y);
      host.run(2);
      snap();
    }
    host.touchUp(0, TURN[18][0], TURN[18][1]);
    host.run(30);
    snap();
    host.touchTap(0, 90, 40);
    host.run(30);
    snap();
    return frames;
  }
  /**
   * The wrapped card and the shelf's compiled card, the same gesture on both: the SAME frames at
   * every step (the rewrite touches no LED call) and, at the output defaults, the SAME messages.
   */
  async function asShipped(
    id: string,
    tuned?: Record<string, number>,
  ): Promise<void> {
    const wrapped = await openPreset(id, {}, { tuned });
    const shipped = await openPreset(id, {}, { raw: true, tuned });
    try {
      expect(gesture(wrapped.host), `${id}: the picture moved`).toEqual(
        gesture(shipped.host),
      );
      expect(wire(wrapped.host.midi), `${id}: the defaults moved`).toEqual(
        wire(shipped.host.midi),
      );
      expect(wire(wrapped.host.midi).length).toBeGreaterThan(0);
      expect(wrapped.host.errors, wrapped.host.errors.join(" | ")).toEqual([]);
    } finally {
      wrapped.host.close();
      shipped.host.close();
    }
  }
  /** Layer-1 cells lit: the comet a received pair draws. */
  const comet = (sim: PadSim): number => {
    let n = 0;
    for (let c = 0; c < 81; c++) if (sim.layer(hwOfCell(c), 1).pha > 0) n++;
    return n;
  };
  /**
   * A first-finger xy card (AURORA, PINWHEEL, STARFIELD): the X and Y axes on their own Type,
   * Channel and Number; each receives - a host value draws the comet at the held pair, nothing
   * sent back; another channel, another number, a neighbour's traffic and Receive Off draw nothing;
   * a previous landing's callback is never reached.
   */
  async function xyCard(
    id: string,
    colour: readonly [number, number, number],
  ): Promise<void> {
    await asShipped(id);
    {
      const { host, sim } = await openPreset(id, {}, { stale: true });
      try {
        host.touchDown(0, 40, 90);
        host.tick();
        expect(wire(host.midi)).toEqual(["0:176:16:40", "0:176:17:90"]);
        host.touchUp(0, 40, 90);
        host.run(200);
        const sent = host.midi.length;
        const before = comet(sim);
        expect(before, "the finger's comet has faded").toBe(0);
        host.midiIn(REPORT, 1, 176, 16, 120);
        host.midiIn(REPORT, 0, 176, 18, 120);
        host.midiIn(14, 0, 176, 16, 120);
        expect(comet(sim), "another channel, number or header").toBe(0);
        expect(host.midiIn(REPORT, 0, 176, 16, 120)).toBe(true);
        host.midiIn(REPORT, 0, 176, 17, 10);
        expect(comet(sim), "a comet at the received pair").toBeGreaterThan(0);
        const stops = glcStops(colour[0], colour[1], colour[2], true).max;
        for (let c = 0; c < 81; c++) {
          const L = sim.layer(hwOfCell(c), 1);
          if (L.pha > 0)
            expect([...L.max], `${id}: the received comet's colour`).toEqual(
              stops,
            );
        }
        expect(host.midi.length, "nothing sent back").toBe(sent);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      const { host, sim } = await openPreset(id, {
        xType: "224",
        channel: "4",
        yType: "208",
        yChannel: "7",
        yReceive: "0",
      });
      try {
        host.touchDown(0, 40, 90);
        host.tick();
        expect(wire(host.midi)).toEqual(["4:224:0:40", "7:208:90:0"]);
        host.touchUp(0, 40, 90);
        host.run(200);
        host.midiIn(REPORT, 7, 208, 10, 0);
        expect(comet(sim), "Y's Receive Off draws nothing").toBe(0);
        host.midiIn(REPORT, 4, 224, 0, 120);
        expect(comet(sim)).toBeGreaterThan(0);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      const { host } = await openPreset(id, {
        xType: "176",
        xCc: "1",
        yType: "176",
        yCc: "74",
        yChannel: "15",
      });
      try {
        host.touchDown(0, 40, 90);
        host.tick();
        expect(wire(host.midi)).toEqual(["0:176:1:40", "15:176:74:90"]);
        // The latch: one control, claimed by the first finger - a second finger sends nothing.
        host.touchDown(1, 100, 10);
        host.tick();
        expect(wire(host.midi)).toEqual(["0:176:1:40", "15:176:74:90"]);
      } finally {
        host.close();
      }
    }
  }

  it("AURORA: the X and Y axes are two outputs, each on its own Type, Channel and Number - at the defaults the preset's pair, 16 and 17 on channel 0, and the preset's picture frame for frame - and each receives: a host value draws the comet at the held pair, nothing sent back; the first finger's claim is the latch", async () => {
    await xyCard("aurora", [255, 170, 34]);
  }, 60000);

  it("PINWHEEL: the X and Y axes are two outputs, each on its own Type, Channel and Number - at the defaults the preset's pair, 16 and 17 on channel 0, and the preset's picture frame for frame - and each receives: a host value draws the comet at the held pair in the first finger's colour, nothing sent back; the first finger's claim is the latch", async () => {
    await xyCard("pinwheel", [255, 0, 128]);
  }, 60000);

  it("STARFIELD: the X and Y axes are two outputs, each on its own Type, Channel and Number - at the defaults the preset's pair, 16 and 17 on channel 0, and the preset's picture frame for frame - and each receives: a host value draws the comet at the held pair, nothing sent back; the first finger's claim is the latch", async () => {
    await xyCard("starfield", [255, 170, 34]);
  }, 60000);

  it("DIAL: the dial is one output on its own Type, Channel and Number - the shelf's Send and Channel become its Number and Channel - at the defaults the preset's relative controller 16 on channel 0 and its picture frame for frame, relative and absolute; an absolute dial receives: a host value is the level the next turn continues from, nothing sent back; a relative dial keeps no value and assigns nil; the first finger's claim is the latch", async () => {
    await asShipped("dial");
    await asShipped("dial", { mode: 1 });
    /** Turn the first finger through `steps` of TURN from twelve o'clock; everything sent since `from`. */
    const turn = (
      host: Awaited<ReturnType<typeof openPreset>>["host"],
      steps: number,
      id = 0,
    ): void => {
      host.touchDown(id, TURN[0][0], TURN[0][1]);
      host.run(2);
      for (const [x, y] of TURN.slice(1, steps + 1)) {
        host.touchMove(id, x, y);
        host.run(2);
      }
      host.touchUp(id, TURN[steps][0], TURN[steps][1]);
      host.run(4);
    };
    {
      // Relative: steps around 64 on controller 16, channel 0; no receive over a previous one.
      const { host } = await openPreset("dial", {}, { stale: true });
      try {
        turn(host, 6);
        const sent = wire(host.midi);
        expect(sent.length).toBeGreaterThan(0);
        for (const m of sent) expect(m).toMatch(/^0:176:16:[0-9]+$/);
        expect(
          host.midiIn(REPORT, 0, 176, 16, 100),
          "nil, not the stale one",
        ).toBe(false);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      // Relative on a pitch bend, channel 6: the same steps, `0, value` on the bend.
      const { host } = await openPreset("dial", {
        midiType: "224",
        channel: "5",
      });
      const shipped = await openPreset("dial", {}, { raw: true });
      try {
        turn(host, 6);
        turn(shipped.host, 6);
        expect(wire(host.midi)).toEqual(
          shipped.host.midi.map((m) => `5:224:0:${m.p2}`),
        );
      } finally {
        host.close();
        shipped.host.close();
      }
    }
    {
      // Absolute: a host value is the level the next turn continues from; nothing sent back.
      const { host } = await openPreset(
        "dial",
        { send: "44" },
        { tuned: { mode: 1 }, stale: true },
      );
      try {
        host.midiIn(REPORT, 1, 176, 44, 100);
        host.midiIn(REPORT, 0, 176, 43, 100);
        host.midiIn(14, 0, 176, 44, 100);
        expect(host.midiIn(REPORT, 0, 176, 44, 100)).toBe(true);
        expect(host.midi.length, "nothing sent back").toBe(0);
        turn(host, 3);
        const first = host.midi[0];
        expect(first.cmd).toBe(176);
        expect(first.p1).toBe(44);
        expect(
          Math.abs(first.p2 - 100),
          `the turn continued from 100, not 64 (sent ${first.p2})`,
        ).toBeLessThanOrEqual(8);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      // Absolute, Receive Off: the level stays the dial's own.
      const { host } = await openPreset(
        "dial",
        { midiReceive: "0", midiType: "208" },
        { tuned: { mode: 1 } },
      );
      try {
        host.midiIn(REPORT, 0, 208, 100, 0);
        turn(host, 3);
        expect(host.midi[0].cmd).toBe(208);
        expect(Math.abs(host.midi[0].p1 - 64)).toBeLessThanOrEqual(8);
      } finally {
        host.close();
      }
    }
    {
      // The latch: a second finger circling while the first holds still sends nothing.
      const { host } = await openPreset("dial");
      try {
        host.touchDown(0, TURN[0][0], TURN[0][1]);
        host.run(2);
        const from = host.midi.length;
        host.touchDown(1, TURN[0][0], TURN[0][1] - 2);
        host.run(2);
        for (const [x, y] of TURN.slice(1, 7)) {
          host.touchMove(1, x, y);
          host.run(2);
        }
        expect(wire(host.midi, from)).toEqual([]);
      } finally {
        host.close();
      }
    }
  }, 60000);

  it("JOYSTICK: the X and Y axes are two outputs - the shelf's Bend and Send become their Types and X's Number - at the defaults the preset's pitch bend and controller 17 of 127-y with the spring's 64 / 64, its picture frame for frame; a rest follows its output's Type (a pitch bend on 64 whatever On lift says); each receives: a host value moves the parked dot to the held pair's cell, nothing sent back, the receive made by the Timer the Setup pulls in; the first finger's claim is the latch", async () => {
    await asShipped("joystick");
    /** The layer-1 cells lit - the parked dot, after a lift the only light. */
    const lit1 = (sim: PadSim): number[] => {
      const out: number[] = [];
      for (let c = 0; c < 81; c++)
        if (sim.layer(hwOfCell(c), 1).pha > 0) out.push(c);
      return out;
    };
    const springAt = (word: string): number => {
      const knob = compilerKnobs(entryById("joystick")).find(
        (k) => k.id === "spring",
      );
      const at = knob?.options.indexOf(word) ?? -1;
      if (at < 0) throw new Error(`no spring ${word}`);
      return at;
    };
    {
      const { host, sim } = await openPreset("joystick", {}, { stale: true });
      try {
        host.touchDown(0, 40, 90);
        host.tick();
        expect(wire(host.midi)).toEqual(["0:224:0:40", "0:176:17:37"]);
        host.touchUp(0, 40, 90);
        host.run(40);
        expect(wire(host.midi, 2), "the rests").toEqual([
          "0:224:0:64",
          "0:176:17:64",
        ]);
        expect(lit1(sim), "parked at the centre").toEqual([40]);
        const sent = host.midi.length;
        host.midiIn(REPORT, 1, 224, 0, 120);
        host.midiIn(REPORT, 0, 176, 16, 120);
        host.midiIn(14, 0, 224, 0, 120);
        expect(lit1(sim), "another channel, number or header").toEqual([40]);
        expect(host.midiIn(REPORT, 0, 224, 0, 120)).toBe(true);
        host.midiIn(REPORT, 0, 176, 17, 10);
        const moved = lit1(sim);
        expect(moved, "one dot, moved right and down").toHaveLength(1);
        expect(moved[0] % 9, "right of centre").toBeGreaterThan(4);
        expect(host.midi.length, "nothing sent back").toBe(sent);
        // The next touch clears it, as it clears the parked dot.
        host.touchDown(0, 64, 64);
        host.tick();
        expect(lit1(sim)).not.toContain(moved[0]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      // X a controller on 20, Y a pitch bend on channel 3, On lift Zero: X rests at 0, Y at 64.
      const { host, sim } = await openPreset(
        "joystick",
        {
          xType: "176",
          send: "20",
          yType: "224",
          yChannel: "2",
          xReceive: "0",
        },
        { tuned: { spring: springAt("zero") } },
      );
      try {
        host.touchDown(0, 40, 90);
        host.tick();
        expect(wire(host.midi)).toEqual(["0:176:20:40", "2:224:0:37"]);
        host.touchUp(0, 40, 90);
        host.run(40);
        expect(wire(host.midi, 2)).toEqual(["0:176:20:0", "2:224:0:64"]);
        const parked = lit1(sim);
        host.midiIn(REPORT, 0, 176, 20, 120);
        expect(lit1(sim), "X's Receive Off moves nothing").toEqual(parked);
        host.midiIn(REPORT, 2, 224, 0, 120);
        expect(lit1(sim)).not.toEqual(parked);
        // The latch: a second finger sends nothing while the first holds.
        const from = host.midi.length;
        host.touchDown(0, 40, 90);
        host.tick();
        host.touchDown(1, 100, 10);
        host.tick();
        expect(wire(host.midi, from)).toEqual(["0:176:20:40", "2:224:0:37"]);
        expect(host.errors, host.errors.join(" | ")).toEqual([]);
      } finally {
        host.close();
      }
    }
    {
      // On lift Off: no rest at all, whatever the Types.
      const { host } = await openPreset(
        "joystick",
        { xType: "208" },
        { tuned: { spring: springAt("off") } },
      );
      try {
        host.touchDown(0, 40, 90);
        host.tick();
        host.touchUp(0, 40, 90);
        host.run(40);
        expect(wire(host.midi)).toEqual(["0:208:40:0", "0:176:17:37"]);
      } finally {
        host.close();
      }
    }
  }, 60000);
});
