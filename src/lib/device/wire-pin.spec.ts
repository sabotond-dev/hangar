// The wire pin: what is written is byte for byte what the meters measured.
//
// 07-CONTEXT D-10 says the strings TRY ON DEVICE writes are the tuner's own -
// the compiled Setup and Timer for a compiler-driven entry, the rendered text
// for a hand-authored one - and that they go on the wire verbatim. D-17 says
// the tuner publishes them from inside land(), beside the numbers that measured
// them, and withdraws them (undefined) the instant a knob moves. This file holds
// both as four tests across EVERY catalog entry, so the sentence "installed
// means these exact bytes" is a property of the tree rather than of a plan.
//
// WHY THE PIN IS EXACT, and why nothing compresses on the way to the wire.
// cost() budgets each event as Math.max(measure(lua), lua.length) + reserved,
// and the uncompressed figure is the larger by exactly one character per
// action - the space after each `]]` the minifier deletes. With the shipped
// reserve of 0 / 0 that makes setup.length === cost().setup.used for every
// preset, both events, zero mismatches (07-RESEARCH measured all nine; test 1
// re-derives the table). Compressing the strings at install time would make
// the written length one short of the meter per action and break the pin -
// test 3's last assertion is the negative that proves the write did not.
//
// FOR A LUA ENTRY the rendered text is already a fixed point of compressScript
// across its whole knob cross-product - src/lib/catalog/lua-entries.sweep.spec.ts
// test 1 sweeps that, and test 2 here CITES it rather than re-sweeping: the
// landed pair is renderLua's output, and at the defaults its length is its
// own measure.
//
// TWO CLOCKS. Tests 1 to 3 await the FIRST defined onconfig through a promise,
// on the real clock: the Lua route crosses a real asynchronous boundary (a
// dynamic import and a Lua VM being built), which a fixed count of microtask
// hops cannot be trusted to cover. Test 4 is a debounce question, so it uses
// model.spec.ts's discipline exactly - vi.useFakeTimers(), settle() for the
// first landing (a promise chain, not a timer), advanceTimersByTimeAsync for
// the window.
//
// NO AGENT WRITES TO A DEVICE. Every write in this file lands in
// FakeTransport.writes, through the same RequestQueue and writeAll the real
// panel will use, and nothing here opens a port. SINCE 13-17 THAT IS FIVE
// FRAMES, not four (12.1-07), three (12-03) or two: the system timer slot
// (255/6) goes on the wire first of all, then the page init (255/0), then the
// utility (255/4 - the empty string for every catalog entry, which the store
// substitutes and this rig does not), then the pair - SLOTS' order in
// sequence.ts - and since 12.1-08 this file pins the library's two: the two library
// strings TOUCH_LIBRARY_TIMER and TOUCH_LIBRARY reach 255/6 and 255/0
// verbatim for a Lua entry (test 2 pins what the tuner publishes, test 3 what
// the wire carries), and the pair's bytes as before. SINCE 12.1-08b A PRESET
// LANDS THE SAME TWO STRINGS (12.1-CONTEXT D-26 item 2, D-27): its state
// carries the library's knots and its compiled handler calls K, G and N by
// name, so test 1 pins the published pair of every compiler-driven entry to
// the exports and test 3 pins AURORA's two system frames to them - where,
// from 12-03 until 12.1-08b, both carried the empty string the install store
// substituted the firmware defaults for.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { GridScript } from "@intechstudio/grid-protocol";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  EVENT_UTILITY,
  FrameScanner,
  TERMINATOR,
  type DecodedClass,
  decodeFrame,
} from "$lib/protocol";
import { EVENT_BUDGET } from "../../vendor/botor/_pad";
import { CATALOG, type CatalogEntry } from "../catalog";
import { TOUCH_LIBRARY, TOUCH_LIBRARY_TIMER } from "../catalog/library";
import {
  compileState,
  costOf,
  measureLua,
  padReady,
  type PadReserved,
} from "../pad";
import type { SimEngine } from "../sim/engine";
import { renderLua } from "../sim/lua-pad-sim";
import {
  buildTuner,
  COMPILE_DEBOUNCE_MS,
  type ConfigStrings,
  type Tuner,
} from "../tune/model";
import { resetAll } from "../tune/state";
import type { TuneView } from "../tune/view";
import { FakeTransport } from "../transport/fake";
import { zonaResponder, type ZonaState } from "../transport/fixtures/synthetic";
import { RequestQueue } from "../transport/queue";
import {
  writeAll,
  type ConfigSet,
  type WriteTarget,
} from "../transport/sequence";

/** Not the first page, for sequence.spec.ts's reason: a constant would be caught. */
const ACTIVE_PAGE = 2;
const TARGET: WriteTarget = { sx: 0, sy: 0, page: ACTIVE_PAGE };

/** Every catalog entry on one route. Empty is a failure, asserted where used. */
const entriesOn = (preview: CatalogEntry["preview"]): CatalogEntry[] =>
  CATALOG.filter((entry) => entry.preview === preview);

const occurrences = (haystack: string, needle: string): number =>
  haystack.split(needle).length - 1;

const pad = (n: number, width = 4): string => String(n).padStart(width);

// ---------------------------------------------------------------------------
// The tuner, landed once.

interface Landing {
  tuner: Tuner;
  config: ConfigStrings;
  /**
   * THE METERS AS THE TUNER PUBLISHED THEM at the landing - the `used` figures
   * of the view land() emitted immediately before the pair. This is the number
   * the visitor is looking at, and it is what D-10's "what the meters
   * measured" means: an independent costOf() proves the compiler's arithmetic,
   * this proves the tuner's, and only this one moves if a reserve is added
   * (which is the negative check for the shipped 0 / 0).
   */
  meters: { setup: number; timer: number };
  engines: SimEngine[];
}

/**
 * Build a tuner at its defaults and resolve on its FIRST defined onconfig - the
 * landing of the first measurement, on either route. Every callback the tuner
 * takes is supplied, so this is the shape TuningRegion.svelte hands it minus
 * the rendering. `reserved` is passed through untouched: absent is the shipped
 * 0 / 0, and the pin below is stated against exactly that.
 */
function landing(entryId: string, reserved?: PadReserved): Promise<Landing> {
  return new Promise<Landing>((resolve, reject) => {
    const engines: SimEngine[] = [];
    let view: TuneView | undefined;
    let config: ConfigStrings | undefined;
    let meters: Landing["meters"] | undefined;
    let built: Tuner | undefined;
    const finish = (): void => {
      if (built && config && meters) {
        resolve({ tuner: built, config, meters, engines });
      }
    };
    buildTuner({
      entryId,
      reserved,
      onview: (next) => {
        view = next;
      },
      onpreview: (engine) => void engines.push(engine),
      onladder: () => undefined,
      onover: () => undefined,
      onconfig: (next) => {
        if (next && !config) {
          config = next;
          // land() emits the view, then the pair: the view in hand here is
          // the landing's own, and its numbers are the ones on the meters.
          if (!view) throw new Error("a pair landed before any view");
          meters = { setup: view.setup.used, timer: view.timer.used };
          finish();
        }
      },
    }).then((tuner) => {
      built = tuner;
      finish();
    }, reject);
  });
}

/**
 * destroy() deliberately leaves the engine it has published alive - the row
 * owns it (model.spec.ts test 8). Nothing owns it here, so close it: on the
 * Lua route that is a real VM.
 */
function release({ tuner, engines }: Landing): void {
  tuner.destroy();
  for (const engine of engines) {
    (engine as SimEngine & { close?: () => void }).close?.();
  }
}

/** model.spec.ts's flush: a fixed number of hops, for a promise chain of fixed length. */
async function settle(): Promise<void> {
  for (let index = 0; index < 64; index++) await Promise.resolve();
}

// ---------------------------------------------------------------------------
// The wire. sequence.spec.ts's rig() and written(), copied rather than shared.

const zonaState = (): ZonaState => ({
  sx: 0,
  sy: 0,
  activePage: ACTIVE_PAGE,
  configs: {
    [EVENT_SETUP]: "--[[@cb]]print(1)",
    [EVENT_TIMER]: "--[[@cb]]print(2)",
  },
});

function rig(): { transport: FakeTransport; queue: RequestQueue } {
  const transport = new FakeTransport({
    responder: zonaResponder(zonaState()),
  });
  const queue = new RequestQueue(transport, { preSendDelayMs: 0 });
  const scanner = new FrameScanner();
  transport.onData((chunk) => {
    for (const frame of scanner.push(chunk)) {
      const decoded = decodeFrame(frame);
      if (decoded.ok) for (const cls of decoded.classes) queue.deliver(cls);
    }
  });
  transport.onClose((reason) => queue.abort(reason));
  return { transport, queue };
}

/** Every outbound frame, decoded back into the classes it carried. */
function written(transport: FakeTransport): DecodedClass[][] {
  return transport.writes.map((bytes) => {
    const frame = [...bytes];
    if (frame[frame.length - 1] === TERMINATOR) frame.pop();
    const decoded = decodeFrame(frame);
    if (!decoded.ok) throw new Error(`a written frame did not decode`);
    return decoded.classes;
  });
}

const configWrites = (transport: FakeTransport): DecodedClass[] =>
  written(transport)
    .flat()
    .filter((c) => c.class_name === "CONFIG" && c.class_instr === "EXECUTE");

// ---------------------------------------------------------------------------
// The store's decision, in the shape the install store will use (07-10).

type WriteDecision =
  | { ok: true; strings: ConfigSet }
  | { ok: false; reason: "measuring" | "over-budget" };

/**
 * Undefined is "not ready to write" - the tuner is measuring, or a knob moved
 * inside the debounce window and the strings on screen are not the strings in
 * hand (Pitfall 5). A pair over the budget is refused here too, before
 * sendConfig's own RangeError could ever be reached.
 */
function stringsOrRefuse(config: ConfigStrings | undefined): WriteDecision {
  if (!config) return { ok: false, reason: "measuring" };
  if (
    config.setup.length > EVENT_BUDGET ||
    config.timer.length > EVENT_BUDGET
  ) {
    return { ok: false, reason: "over-budget" };
  }
  return {
    ok: true,
    strings: {
      // The fourth key (12.1-07), first in SLOTS; its bytes are pinned on the
      // wire in test 3 (12.1-08). The fifth (13-17), third in SLOTS; its
      // bytes - the empty string, for every catalog entry - pinned there too.
      systemTimer: config.systemTimer,
      system: config.system,
      systemUtility: config.systemUtility,
      setup: config.setup,
      timer: config.timer,
    },
  };
}

describe("the wire pin: the bytes are the numbers (D-10, D-17)", () => {
  beforeAll(async () => {
    await padReady();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("for every compiler-driven entry, the published strings are the compiled text and their lengths are the meter's used figures", async () => {
    const entries = entriesOn("padsim");
    expect(entries.length, "compiler-driven entries exist").toBeGreaterThan(0);

    const rows: string[] = [];
    let presets = 0;
    let mismatches = 0;

    for (const entry of entries) {
      // reserved ABSENT: the shipped 0 / 0. The pin is stated against it.
      const landed = await landing(entry.id);
      try {
        const { config } = landed;
        // Independently: the same state the tuner measures at the defaults
        // (stateOf() returns resetAll() when every knob is at its default,
        // and the preset field is load-bearing - model.spec.ts test 4).
        const result = await compileState(resetAll(entry));
        const cost = await costOf(result);
        const compressed = GridScript.compressScript(config.setup).length;
        const actions = occurrences(config.setup, "--[[@");

        const { meters } = landed;
        const exact =
          config.setup === result.setupLua &&
          config.timer === result.timerLua &&
          config.setup.length === cost.setup.used &&
          config.timer.length === cost.timer.used &&
          config.setup.length === meters.setup &&
          config.timer.length === meters.timer;
        if (!exact) mismatches += 1;
        presets += 1;
        rows.push(
          `${entry.id.padEnd(10)} setup ${pad(config.setup.length)} used ${pad(cost.setup.used)} meter ${pad(meters.setup)} | ` +
            `timer ${pad(config.timer.length)} used ${pad(cost.timer.used)} meter ${pad(meters.timer)} | ` +
            `compressed(setup) ${pad(compressed)} | actions ${actions} | ` +
            (cost.fits ? "fits" : "OVER"),
        );

        // The text.
        expect(
          config.setup,
          `${entry.id}: the published Setup is not the compiled text`,
        ).toBe(result.setupLua);
        expect(
          config.timer,
          `${entry.id}: the published Timer is not the compiled text`,
        ).toBe(result.timerLua);
        // THE LIBRARY'S TWO HALVES, VERBATIM, ON A PRESET (12.1-08b): what
        // test 2 pins for a Lua entry, pinned here for every compiler-driven
        // one. A preset whose landing carried anything else would put a
        // handler that calls K, G and N on a module that does not define
        // them - the failure the library's own smoke gate names as
        // "attempt to call a nil value (global 'G')".
        expect(
          config.system,
          `${entry.id}: the page init is not the touch library, verbatim`,
        ).toBe(TOUCH_LIBRARY);
        expect(
          config.systemTimer,
          `${entry.id}: the page timer is not the library's second half, verbatim`,
        ).toBe(TOUCH_LIBRARY_TIMER);
        // And the handler really reaches it: every carded preset's Setup
        // calls at least one of the library's three entry points.
        expect(
          /\b[KGN]\(/.test(config.setup),
          `${entry.id}: the compiled Setup calls none of K, G or N, so the library it lands is dead weight`,
        ).toBe(true);
        // The numbers, twice: the compiler's own cost() of the same result,
        // and THE METER THE TUNER SHOWED at the landing. The first holds
        // whatever the tuner does; the second is the one a reserve would
        // move, and the one D-10's sentence is about.
        expect(
          config.setup.length,
          `${entry.id}: Setup's length is not cost()'s used figure`,
        ).toBe(cost.setup.used);
        expect(
          config.timer.length,
          `${entry.id}: Timer's length is not cost()'s used figure`,
        ).toBe(cost.timer.used);
        expect(
          config.setup.length,
          `${entry.id}: Setup's length is not the meter the tuner published`,
        ).toBe(meters.setup);
        expect(
          config.timer.length,
          `${entry.id}: Timer's length is not the meter the tuner published`,
        ).toBe(meters.timer);
        // Why the pin is exact: the compressed form is shorter by exactly
        // one character per action, so the uncompressed figure is the one
        // cost() reports and the one that must go on the wire.
        expect(
          actions,
          `${entry.id}: no action marker in Setup`,
        ).toBeGreaterThan(0);
        expect(
          cost.setup.used - compressed,
          `${entry.id}: compressed Setup is not one character per action shorter`,
        ).toBe(actions);
      } finally {
        release(landed);
      }
    }

    console.log(
      [
        "wire-pin: reserve 0 / 0, every compiler-driven entry at its defaults",
        ...rows,
        `presets: ${presets}   mismatches: ${mismatches}`,
      ].join("\n"),
    );
    // EIGHT since plan 12-10: the `tpad` preset is on the shelf but not in the
    // catalog - the hand-authored TRACKPAD replaced it as the card - so the
    // walk over compiler-driven CATALOG entries visits eight. The ninth is
    // still pinned byte for byte by presets.spec.ts test 4 against the
    // compiler, which is the same arithmetic this floor guards.
    expect(
      presets,
      "the eight carded shelf presets at least",
    ).toBeGreaterThanOrEqual(8);
    expect(mismatches).toBe(0);
  }, 30_000);

  it("for every Lua entry, the published strings are the rendered text, and the rendered text is already canonical", async () => {
    const entries = entriesOn("lua");
    expect(entries.length, "hand-authored entries exist").toBeGreaterThan(0);

    let checked = 0;
    let emptyTimers = 0;
    for (const entry of entries) {
      const landed = await landing(entry.id);
      try {
        const rendered = renderLua(entry, landed.tuner.indices);
        expect(
          landed.config,
          `${entry.id}: the published pair is not renderLua's text`,
        ).toEqual({
          systemTimer: TOUCH_LIBRARY_TIMER,
          system: TOUCH_LIBRARY,
          systemUtility: "",
          ...rendered,
        });
        // AND THE PAGE INIT IS THE TOUCH LIBRARY, VERBATIM (12-07), AND THE
        // PAGE TIMER IS ITS SECOND HALF, VERBATIM (12.1-08). The page init was
        // the empty string for every entry from 12-03 until the library
        // existed - the tuner saying "this entry has no page init of its own",
        // which the install store substituted SYSTEM_DEFAULT_SETUP for in one
        // place before any write. A hand-authored entry HAS one now, because
        // from 12-08 its Setup calls the library by name, so the substitution
        // stops firing for these entries and the string below is what reaches
        // 255/0. Since 12.1-02 the library is in two halves - 255/0 defines G
        // and calls self:tim(); 255/6 defines the rest - and since 12.1-07 the
        // tuner publishes both, so TOUCH_LIBRARY_TIMER is what reaches 255/6
        // and the store's #systemStringOr substitution for 255/6 stops firing the same way.
        //
        // The preset half of the rule moved at 12.1-08b and is asserted in the
        // test above: a preset publishes the same two strings now, because
        // its compiled handler calls the library by name. A firmware default
        // is still a wire fact no module under src/lib/tune/ may know
        // (ladder.spec.ts:275); the install store's substitution stays where
        // it is and is CLEAR's alone.
        expect(
          landed.config.system,
          `${entry.id}: the page init is not the touch library, verbatim`,
        ).toBe(TOUCH_LIBRARY);
        expect(
          landed.config.systemTimer,
          `${entry.id}: the page timer is not the library's second half, verbatim`,
        ).toBe(TOUCH_LIBRARY_TIMER);
        expect(
          landed.config.systemTimer,
          `${entry.id}: the two halves of the library are one string`,
        ).not.toBe(landed.config.system);
        // Verbatim means measured: each half of the library is canonical under
        // the pinned minifier, so its length IS its cost and nothing on this
        // path recompresses it. library.spec.ts owns the budgets; this owns
        // the identity of the strings that reach the wire.
        expect(
          landed.config.system.length,
          `${entry.id}: the page init is not its own minified form`,
        ).toBe(await measureLua(landed.config.system));
        expect(
          landed.config.systemTimer.length,
          `${entry.id}: the page timer is not its own minified form`,
        ).toBe(await measureLua(landed.config.systemTimer));
        for (const event of ["setup", "timer"] as const) {
          const text = landed.config[event];
          // The meter the tuner showed is the string's length, empty included.
          expect(
            text.length,
            `${entry.id} ${event}: the length is not the meter the tuner published`,
          ).toBe(landed.meters[event]);
          // An empty Timer is a TRUE zero (MORPH ships one), not a string
          // to measure; the model reports 0 for it without a measure call.
          if (text === "") {
            emptyTimers += 1;
            continue;
          }
          // The fixed-point property lua-entries.sweep.spec.ts test 1 holds
          // across the whole knob cross-product, cited at the defaults: a
          // canonical string's measure IS its length.
          expect(
            text.length,
            `${entry.id} ${event}: the rendered text is not its own minified form`,
          ).toBe(await measureLua(text));
        }
        checked += 1;
      } finally {
        release(landed);
      }
    }
    expect(checked).toBe(entries.length);
    expect(emptyTimers, "MORPH's empty Timer was walked").toBeGreaterThan(0);
  }, 30_000);

  it("the bytes on the wire are the published strings, verbatim", async () => {
    const landed = await landing("aurora");
    try {
      const { config } = landed;
      const { transport, queue } = rig();
      await writeAll(queue, TARGET, config);

      const writes = configWrites(transport);
      // FIVE since 13-17 (SLOTS: 255/6 first, 255/4 third), all five pinned:
      // the system timer, then the page init, then the utility, then Timer,
      // then Setup - the order writeAll owns, read off the wire by element
      // and event.
      expect(writes, "five CONFIG/EXECUTE frames").toHaveLength(5);
      const [systemTimer, system, systemUtility, timer, setup] = writes;
      expect(
        writes.map((c) => [
          Number(c.class_parameters.ELEMENTNUMBER),
          Number(c.class_parameters.EVENTTYPE),
        ]),
        "the five frames are not SLOTS' order",
      ).toEqual([
        [ELEMENT_SYSTEM, EVENT_TIMER],
        [ELEMENT_SYSTEM, EVENT_SETUP],
        [ELEMENT_SYSTEM, EVENT_UTILITY],
        [ELEMENT_TOUCH, EVENT_TIMER],
        [ELEMENT_TOUCH, EVENT_SETUP],
      ]);
      // THE FIFTH FRAME'S BYTES (13-17): a catalog entry has no utility body,
      // so what this rig - writeAll, no store - puts on 255/4 is the EMPTY
      // STRING at length 0, verbatim from the landing. The install store
      // substitutes SYSTEM_DEFAULT_UTILITY before it calls writeAll (in one
      // place, #systemStringOr for 255/4), which install.spec.ts pins; the empty string
      // reaching the wire here is the proof that writeAll itself substitutes
      // nothing.
      expect(Number(systemUtility.class_parameters.ELEMENTNUMBER)).toBe(
        ELEMENT_SYSTEM,
      );
      expect(Number(systemUtility.class_parameters.EVENTTYPE)).toBe(
        EVENT_UTILITY,
      );
      expect(
        String(systemUtility.class_parameters.ACTIONSTRING),
        "a preset's 255/4 is not the landing's empty string",
      ).toBe(config.systemUtility);
      expect(config.systemUtility).toBe("");
      expect(Number(systemUtility.class_parameters.ACTIONLENGTH)).toBe(0);
      // A PRESET'S TWO SYSTEM FRAMES CARRY THE LIBRARY SINCE 12.1-08b. From
      // 12-03 until then a preset published the empty string in both slots
      // and this rig put the empty string on the wire (writeAll does not
      // substitute - the install store does, in one place, before it calls
      // writeAll); the frame count was four either way. Now the bytes are the
      // two exports, pinned here as the Lua landing below pins them.
      expect(
        String(systemTimer.class_parameters.ACTIONSTRING),
        "a preset's 255/6 is not TOUCH_LIBRARY_TIMER, verbatim",
      ).toBe(TOUCH_LIBRARY_TIMER);
      expect(String(systemTimer.class_parameters.ACTIONSTRING)).toBe(
        config.systemTimer,
      );
      expect(Number(systemTimer.class_parameters.ACTIONLENGTH)).toBe(
        TOUCH_LIBRARY_TIMER.length,
      );
      expect(
        String(system.class_parameters.ACTIONSTRING),
        "a preset's 255/0 is not TOUCH_LIBRARY, verbatim",
      ).toBe(TOUCH_LIBRARY);
      expect(String(system.class_parameters.ACTIONSTRING)).toBe(config.system);
      expect(Number(system.class_parameters.ACTIONLENGTH)).toBe(
        TOUCH_LIBRARY.length,
      );
      expect(Number(timer.class_parameters.EVENTTYPE)).toBe(EVENT_TIMER);
      expect(String(timer.class_parameters.ACTIONSTRING)).toBe(config.timer);
      expect(Number(timer.class_parameters.ACTIONLENGTH)).toBe(
        config.timer.length,
      );
      expect(Number(setup.class_parameters.EVENTTYPE)).toBe(EVENT_SETUP);
      const setupOnWire = String(setup.class_parameters.ACTIONSTRING);
      expect(setupOnWire).toBe(config.setup);
      expect(Number(setup.class_parameters.ACTIONLENGTH)).toBe(
        config.setup.length,
      );

      // THE NEGATIVE that proves nothing compressed on the way to the wire:
      // the minifier's form is strictly shorter than what was written, so what
      // was written cannot be the minifier's form.
      const compressed = GridScript.compressScript(config.setup);
      expect(
        compressed.length,
        "the written Setup is already the compressed form - the pin is gone",
      ).toBeLessThan(setupOnWire.length);
      expect(compressed).not.toBe(setupOnWire);
    } finally {
      release(landed);
    }

    // THE LIBRARY ON THE WIRE (12.1-08): for a Lua entry the two exported
    // strings reach 255/6 and 255/0 byte for byte, in that order, ahead of
    // the rendered pair. Test 2 pins the published strings to the exports;
    // this pins the frames to the published strings, so the exports ARE the
    // bytes - which is what the runbook's four-strings row reads off a module.
    const lua = await landing("orbit");
    try {
      const { config } = lua;
      const { transport, queue } = rig();
      await writeAll(queue, TARGET, config);
      const writes = configWrites(transport);
      expect(writes, "five CONFIG/EXECUTE frames for a Lua entry").toHaveLength(
        5,
      );
      const [systemTimer, system, systemUtility] = writes;
      expect(Number(systemUtility.class_parameters.EVENTTYPE)).toBe(
        EVENT_UTILITY,
      );
      expect(
        String(systemUtility.class_parameters.ACTIONSTRING),
        "a Lua entry's 255/4 is the landing's empty string",
      ).toBe("");
      expect(Number(systemTimer.class_parameters.ELEMENTNUMBER)).toBe(
        ELEMENT_SYSTEM,
      );
      expect(Number(systemTimer.class_parameters.EVENTTYPE)).toBe(EVENT_TIMER);
      expect(
        String(systemTimer.class_parameters.ACTIONSTRING),
        "255/6 is not TOUCH_LIBRARY_TIMER, verbatim",
      ).toBe(TOUCH_LIBRARY_TIMER);
      expect(Number(systemTimer.class_parameters.ACTIONLENGTH)).toBe(
        TOUCH_LIBRARY_TIMER.length,
      );
      expect(Number(system.class_parameters.ELEMENTNUMBER)).toBe(
        ELEMENT_SYSTEM,
      );
      expect(Number(system.class_parameters.EVENTTYPE)).toBe(EVENT_SETUP);
      expect(
        String(system.class_parameters.ACTIONSTRING),
        "255/0 is not TOUCH_LIBRARY, verbatim",
      ).toBe(TOUCH_LIBRARY);
      expect(Number(system.class_parameters.ACTIONLENGTH)).toBe(
        TOUCH_LIBRARY.length,
      );
      // And the same negative as above, on each half: the minifier's form of
      // a canonical string is the string itself, so nothing on the way to
      // the wire could have shortened it without breaking the identity.
      expect(GridScript.compressScript(TOUCH_LIBRARY_TIMER)).toBe(
        String(systemTimer.class_parameters.ACTIONSTRING),
      );
      expect(GridScript.compressScript(TOUCH_LIBRARY)).toBe(
        String(system.class_parameters.ACTIONSTRING),
      );
    } finally {
      release(lua);
    }
  }, 30_000);

  it("the pair is undefined while measuring, and no write can be built from undefined", async () => {
    vi.useFakeTimers();
    const configs: (ConfigStrings | undefined)[] = [];
    const engines: SimEngine[] = [];
    const tuner = await buildTuner({
      entryId: "aurora",
      onview: () => undefined,
      onpreview: (engine) => void engines.push(engine),
      onladder: () => undefined,
      onover: () => undefined,
      onconfig: (config) => void configs.push(config),
    });
    // Before the landing, nothing at all: the first defined call IS the landing.
    expect(configs, "a call arrived before anything landed").toEqual([]);
    await settle();
    expect(configs, "the first landing is the first call").toHaveLength(1);
    expect(configs[0]).toBeDefined();

    // A knob moves: undefined on the same tick, and still undefined however
    // many microtasks run inside the window.
    const knob = tuner.knobs[0];
    expect(knob, "aurora has knobs").toBeDefined();
    tuner.set(knob.id, (knob.default + 1) % knob.options.length);
    expect(
      configs.at(-1),
      "the old pair survived the knob move",
    ).toBeUndefined();
    await settle();
    expect(configs.at(-1)).toBeUndefined();

    // The store's shape: a refusal builds no request and reaches no transport.
    const { transport, queue } = rig();
    const midWindow = stringsOrRefuse(configs.at(-1));
    expect(midWindow.ok).toBe(false);
    if (!midWindow.ok) expect(midWindow.reason).toBe("measuring");
    if (midWindow.ok) await writeAll(queue, TARGET, midWindow.strings);

    const tooLong = stringsOrRefuse({
      systemTimer: "",
      system: "",
      systemUtility: "",
      setup: "-".repeat(EVENT_BUDGET + 1),
      timer: "",
    });
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(tooLong.reason).toBe("over-budget");
    if (tooLong.ok) await writeAll(queue, TARGET, tooLong.strings);

    expect(transport.writes, "a refusal reached the transport").toHaveLength(0);

    // And the landed pair after the window is accepted, so the refusals above
    // are decisions rather than a helper that refuses everything.
    await vi.advanceTimersByTimeAsync(COMPILE_DEBOUNCE_MS);
    await settle();
    const landed = stringsOrRefuse(configs.at(-1));
    expect(landed.ok, "the recompiled pair was refused").toBe(true);
    if (landed.ok) {
      expect(landed.strings.setup.length).toBeLessThanOrEqual(EVENT_BUDGET);
    }
    expect(
      transport.writes,
      "an accepted pair was written without a click",
    ).toHaveLength(0);

    tuner.destroy();
  });
});
