// The Lua host's own proof.
//
// ORDER MATTERS. Test 1 observes the VM gate cold - two calls sharing one
// promise, one factory serving every host - and it can only see that state
// once per file, because Vitest isolates module state per file and the memo is
// resolved from the first await onwards. It MUST stay first, and it is the only
// test permitted to call resetLuaReadyForTests(). Do not reorder.
//
// Every test drives a tiny purpose-built Lua string rather than a catalog
// entry. The catalog does not exist to this module; plan 08-03 is where real
// configurations meet the host, and a spec that reached for one here would fail
// for two unrelated reasons at once.
//
// The four traps below are the ones that pass SILENTLY when they are wrong: an
// identity glag paints a plausible, mirrored picture; a fractional argument that
// rounds instead of zeroing looks like a rounding choice; a clamped colour looks
// like a brightness choice; and an automatically re-armed timer hides the
// pcall-death that a real Timer with its gtt in the wrong place would suffer on
// hardware. None of them fails loudly on their own, so each one is pinned by a
// test that goes red when the behaviour is removed.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CELLS, DEFAULT_PAD_STATE, GRID } from "../../vendor/botor/_pad";
import { PadSim, screenToHw } from "../../vendor/botor/pad-sim";
import { createLuaHost, type LuaHost } from "./lua-host";
import { luaReady, resetLuaReadyForTests } from "./ready";

/**
 * The blank, fully detached sim the host wraps. With every PadSlot owned by
 * "user", rebuild() arms nothing, timerPeriod stays null and runTimerBody never
 * fires, so sim.tick() degenerates to grid_led_tick plus the render. Test 5
 * proves that rather than assuming it.
 */
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

/** Ticks one at a time and reports the tick numbers on which the Timer fired. */
function fireTicks(host: LuaHost, ticks: number): number[] {
  const fired: number[] = [];
  let seen = host.midi.length;
  for (let t = 1; t <= ticks; t++) {
    host.tick();
    if (host.midi.length > seen) {
      fired.push(t);
      seen = host.midi.length;
    }
  }
  return fired;
}

describe("the Lua host", () => {
  it("gates the VM lazily and memoised, and one factory serves every host", async () => {
    // MUST stay first - see the ORDER MATTERS note at the top of this file.
    const first = luaReady();
    const second = luaReady();
    expect(first).toBe(second);

    const factory = await first;
    const a = await createLuaHost({ sim: blank(), setup: "" });
    const b = await createLuaHost({ sim: blank(), setup: "" });
    // Two hosts, one factory: building a second host must not construct a
    // second VM factory and must not re-fetch the WebAssembly.
    expect(await luaReady()).toBe(factory);
    a.close();
    b.close();

    resetLuaReadyForTests();
    const afterReset = luaReady();
    expect(afterReset).not.toBe(first);
    await afterReset;
  });

  it("resolves glag through the serpentine, and moves exactly 40 of the 81 cells", async () => {
    // Setup reports glag's answer for every logical cell back through the MIDI
    // recorder: p1 carries the logical index, p2 carries what Lua received.
    const host = await createLuaHost({
      sim: blank(),
      setup: "for n=0,80 do self:gms(0,0,n,glag(0,n),0) end",
    });
    expect(host.midi).toHaveLength(CELLS);

    const answers = host.midi.map((record) => ({
      n: record.p1,
      hw: record.p2,
    }));

    // The count is asserted FIRST and on purpose. It is what catches an
    // identity stub creeping back in, and it reports the diagnosis (0 cells
    // moved) rather than one arbitrary cell's coordinates. Equality alone would
    // still pass if both sides were wrong together. 40 is derived by hand from
    // the serpentine: screenToHw mirrors the five EVEN rows, each of which
    // moves eight of its nine cells - the centre cell of a mirrored row stays
    // put - so 5 x 8 = 40.
    expect(answers.filter((a) => a.hw !== a.n)).toHaveLength(40);

    for (const { n, hw } of answers) {
      expect(hw).toBe(screenToHw(n % GRID, Math.floor(n / GRID)));
    }
    host.close();
  });

  it("zeroes a fractional argument instead of rounding it or throwing", async () => {
    // F2Ieq. Reaching the assertions at all is half the proof: PadSim's wrapU8
    // THROWS on a non-integer, a throw inside a Lua-called stub propagates out
    // of doString, and createLuaHost would therefore have rejected.
    const sim = blank();
    const host = await createLuaHost({
      sim,
      setup: "glp(3,1,127.5) glp(4,1,127.0) glp(5,1,60//7)",
    });
    expect(sim.layer(3, 1).pha).toBe(0);
    // An integral float is an integer to the C conversion, so 127.0 stores 127.
    expect(sim.layer(4, 1).pha).toBe(127);
    // Lua's floor division closes the float, which is why every emitted
    // expression ends in `// 1`.
    expect(sim.layer(5, 1).pha).toBe(8);
    expect(host.errors).toEqual([]);
    host.close();
  });

  it("truncates a colour channel to uint8 rather than clamping it", async () => {
    const sim = blank();
    const host = await createLuaHost({
      sim,
      setup: "glc(3,1,260,10,5,0) glc(4,1,300,60,5,0) glc(5,1,300,60,5,1)",
    });
    // 260 wraps to 4. A cell asked for a bright red turns almost black, with no
    // warning anywhere.
    expect(sim.layer(3, 1).max[0]).toBe(4);
    expect(sim.layer(3, 1).mid[0]).toBe(2);
    // glcStops derives min as c/20 under C integer division, so a truncated 4
    // has no minimum stop left at all.
    expect(sim.layer(3, 1).min[0]).toBe(0);
    // 300 wraps to 44, which keeps a nonzero minimum: this pins the /20 and /2
    // derivation and not merely the narrowing.
    expect(sim.layer(4, 1).max).toEqual([44, 60, 5]);
    expect(sim.layer(4, 1).mid).toEqual([22, 30, 2]);
    expect(sim.layer(4, 1).min).toEqual([2, 3, 0]);
    // A nonzero sixth argument forces the minimum stop black.
    expect(sim.layer(5, 1).min).toEqual([0, 0, 0]);
    expect(host.errors).toEqual([]);
    host.close();
  });

  it("wraps a genuinely inert sim, so a later parity result cannot be its own answer", async () => {
    const sim = blank();
    expect(sim.animating).toBe(false);
    expect(sim.pendingTouches).toBe(0);
    expect(sim.frame).toHaveLength(CELLS * 3);

    // Nothing is armed, so a hundred firmware periods change nothing.
    sim.run(100);
    expect(Array.from(sim.frame).every((byte) => byte === 0)).toBe(true);

    // And it stays inert under a host whose Setup writes nothing, which is what
    // makes "the picture came from the Lua route" a claim rather than a hope.
    const host = await createLuaHost({ sim, setup: "" });
    host.run(100);
    expect(Array.from(host.frame).every((byte) => byte === 0)).toBe(true);
    expect(host.timerArmed).toBe(false);
    host.close();
  });

  it("re-arms the timer only where the body re-arms it, exactly as the pcall demands", async () => {
    const ARM = "gtt(0,50) ";
    const BEEP = "self:gms(1,144,60,100,0) ";
    const RAISE = 'error("kaboom") ';

    // A gtt-first body fires every 50 ms - ticks 5, 10, 15, 20 - because Setup
    // armed the one-shot and each body re-arms it before doing anything else.
    const plain = await createLuaHost({
      sim: blank(),
      setup: ARM,
      timer: ARM + BEEP,
    });
    expect(fireTicks(plain, 20)).toEqual([5, 10, 15, 20]);
    expect(plain.errors).toEqual([]);
    plain.close();

    // The same body, raising AFTER its re-arm, keeps firing: the handler runs
    // inside a pcall, so a raise stops that one call and nothing else.
    const raisesLate = await createLuaHost({
      sim: blank(),
      setup: ARM,
      timer: ARM + BEEP + RAISE,
    });
    expect(fireTicks(raisesLate, 20)).toEqual([5, 10, 15, 20]);
    expect(raisesLate.errors).toHaveLength(4);
    expect(raisesLate.errors[0]).toContain("kaboom");
    expect(raisesLate.timerArmed).toBe(true);
    raisesLate.close();

    // The re-arm moved to the END. The first raise kills the timer permanently,
    // which is precisely why every shipped Timer opens with gtt. This half is
    // meaningless without the first: together they say the host models the
    // one-shot rather than re-arming on the config's behalf.
    const raisesEarly = await createLuaHost({
      sim: blank(),
      setup: ARM,
      timer: BEEP + RAISE + ARM,
    });
    expect(fireTicks(raisesEarly, 20)).toEqual([5]);
    expect(raisesEarly.errors).toHaveLength(1);
    expect(raisesEarly.timerArmed).toBe(false);
    raisesEarly.close();
  });

  it("change-gates the touch FIFO, caps it at ten, and pops exactly one per tick", async () => {
    const host = await createLuaHost({
      sim: blank(),
      // No gtt anywhere, so nothing but touch_cb can reach the MIDI recorder.
      setup: "self.touch_cb=function(s,i,e,x,y) s:gms(0,0,x,e,0) end",
    });

    // A motionless finger produces nothing: the gate is on (x, y, event) per
    // contact, so four of these five samples never exist.
    for (let n = 0; n < 5; n++) host.touchMove(0, 10, 10);
    expect(host.pendingTouches).toBe(1);

    // Fifteen genuinely different samples against a queue that already holds
    // one: nine more are taken and the rest are dropped in silence.
    for (let k = 1; k <= 15; k++) host.touchMove(0, 10 + k, 10);
    expect(host.pendingTouches).toBe(10);

    host.tick();
    expect(host.pendingTouches).toBe(9);
    // One sample popped means exactly one dispatch, never a drain loop.
    expect(host.midi).toHaveLength(1);
    expect(host.midi[0].p1).toBe(10);
    expect(host.errors).toEqual([]);
    host.close();
  });

  it("records midi_send in order with the channel first, and raises on an unregistered call", async () => {
    const host = await createLuaHost({
      sim: blank(),
      setup: "self:gms(2,144,60,100,0) self:gms(2,128,60,0,0)",
    });
    // The first argument is a zero-based CHANNEL (ZONA_RECIPES.md:1058). Every
    // @CH knob in this phase depends on it, so it is asserted rather than
    // re-derived.
    expect([...host.midi]).toEqual([
      { ch: 2, cmd: 144, p1: 60, p2: 100, mode: 0 },
      { ch: 2, cmd: 128, p1: 60, p2: 0, mode: 0 },
    ]);
    host.close();

    // Anything outside the registered surface must surface as a Lua error, not
    // as a silent no-op. A typo that does nothing is a card that looks subtly
    // wrong forever; a typo that raises is a card that fails its gate.
    await expect(
      createLuaHost({ sim: blank(), setup: "gnothere(1)" }),
    ).rejects.toThrow(/gnothere/);
  });
});
