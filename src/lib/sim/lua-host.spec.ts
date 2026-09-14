// The Lua host's own proof. ORDER MATTERS: test 1 observes the VM gate cold, which a file can see
// only once (Vitest isolates module state per file and the memo resolves from the first await); it
// stays first and is the only test permitted to call resetLuaReadyForTests(). Every test drives a
// tiny purpose-built Lua string, never a catalog entry. The four traps that pass SILENTLY when wrong
// are each pinned: an identity glag (a plausible mirrored picture), a fractional argument that rounds
// instead of zeroing, a clamped colour, and an automatically re-armed timer hiding a pcall death.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { describe, expect, it } from "vitest";
import { CELLS, DEFAULT_PAD_STATE, GRID } from "../../vendor/botor/_pad";
import { PadSim, screenToHw } from "../../vendor/botor/pad-sim";
import {
  LIBRARY_GLOBALS,
  TOUCH_LIBRARY,
  TOUCH_LIBRARY_TIMER,
} from "../catalog/library";
import {
  createLuaHost,
  HOST_GLOBALS,
  HOST_SELF_METHODS,
  type LuaHost,
} from "./lua-host";
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

  it("exports the surface the VM actually has, in both directions", async () => {
    // HOST_GLOBALS and HOST_SELF_METHODS are what src/lib/catalog/host-surface.spec.ts
    // gates every hand-authored configuration against, so an array that drifted
    // from the VM would not fail - it would quietly widen or narrow the gate.
    // This test is what makes the arrays evidence rather than documentation,
    // and it asserts in BOTH directions: every listed name is really there, and
    // every Grid-shaped name really there is really listed.
    //
    // The callability half runs INSIDE the VM, because nothing public on
    // LuaHost evaluates a string: the probe is the Setup, `error` aborts it,
    // and createLuaHost rejects. A host that constructs at all has already
    // proved every name resolves to a function.
    const probes = [
      ...HOST_GLOBALS.map(
        (name) =>
          `if type(${name})~="function" then error("global ${name} is "..type(${name})) end`,
      ),
      // The asymmetry, asserted from inside: a bare gms must still raise, which
      // is only true while it is bridged under __hangar_gms.
      'if type(gms)~="nil" then error("a bare gms resolved to "..type(gms)) end',
      ...HOST_SELF_METHODS.map(
        (name) =>
          `if type(self.${name})~="function" then error("self:${name} is "..type(self.${name})) end`,
      ),
    ].join(" ");

    const host = await createLuaHost({ sim: blank(), setup: probes });
    expect(host.errors).toEqual([]);

    const keys = host.globalKeys();
    for (const name of HOST_GLOBALS) {
      expect(keys, `${name} is exported but absent from _G`).toContain(name);
    }
    expect(
      keys,
      "a bare gms is reachable, so the bridge stopped bridging",
    ).not.toContain("gms");

    // The other direction, and the one that catches the real mistake: a binding
    // added to registerGlobals with no entry in HOST_GLOBALS would be callable
    // by a configuration and invisible to the gate. Every Grid short name is
    // g + one to four lower-case letters, or one of the four axis-maximum
    // spellings; the host's own bridges are __hangar_-prefixed and no Lua base
    // name has that shape, so the filter needs no exceptions.
    const gridShaped = /^(g[a-z]{1,4}|t[xy]m[ai])$/;
    const listed = HOST_GLOBALS as readonly string[];
    const unlisted = keys.filter(
      (k) => gridShaped.test(k) && !listed.includes(k),
    );
    expect(
      unlisted,
      `these Grid names are in _G but not in HOST_GLOBALS, so the ` +
        `host-surface gate would let a configuration call them unchecked: ` +
        unlisted.join(", "),
    ).toEqual([]);

    host.close();
  });

  it("records a bare gmss whole, and the surface it joined is sixteen names on a booted VM", async () => {
    // gmss is midi_sysex_send. Two or more arguments, EVERY ONE OF THEM ONE
    // PAYLOAD BYTE, and the configuration supplies 0xF0 and 0xF7 itself
    // (`grid_lua_api.c:905-935`, read through `../zona-docs/docs/
    // ZONA_REFERENCE.md:1241` and `:2022`). It is the fourth fire-and-forget
    // out-call on the surface and the first that no compiled recipe uses - the
    // vendored compiler's OUT_CALLS does not list it at all - so a hand-authored
    // entry is the only thing that can reach it, and without this binding such
    // an entry would run on a ZONA and raise in its own catalog card.
    //
    // THE WHOLE PAYLOAD IS RECORDED, IN CALL ORDER. A recorder that stored a
    // count or a length would make the framing assertion an entry needs
    // unwritable, and the framing bytes are exactly the part a later edit is
    // most likely to drop.
    const host = await createLuaHost({
      sim: blank(),
      setup: "gmss(240,1,2,247)gmss(240,127,247)",
    });
    expect(host.errors).toEqual([]);
    expect(
      host.sysex.map((message) => [...message.bytes]),
      "the two messages must arrive whole, in order, framing included",
    ).toEqual([
      [240, 1, 2, 247],
      [240, 127, 247],
    ]);
    host.close();

    // THE FRAMING IS THE CONFIGURATION'S, NOT THE HOST'S. Firmware warns and
    // transmits anyway when 0xF0/0xF7 are missing, so a host that helpfully
    // added them would hide a real defect - and an entry's own framing test
    // would then be asserting the host's behaviour rather than the entry's.
    const bare = await createLuaHost({ sim: blank(), setup: "gmss(1,2)" });
    expect(
      bare.sysex.map((message) => [...message.bytes]),
      "the host must not supply framing the configuration omitted",
    ).toEqual([[1, 2]]);
    bare.close();

    // SIXTEEN, OBSERVED ON A BOOTED VM RATHER THAN READ OFF THE ARRAY. The
    // array is the registration, so counting it would only prove it counts
    // itself; the Grid-shaped keys really in _G are the evidence. The previous
    // test holds the two directions equal, which is what lets this one state a
    // number.
    const probe = await createLuaHost({ sim: blank(), setup: "" });
    const gridShaped = /^(g[a-z]{1,4}|t[xy]m[ai])$/;
    const inTheVm = probe.globalKeys().filter((k) => gridShaped.test(k));
    expect(
      [...inTheVm].sort(),
      "the Grid names really in _G are not the sixteen the host registers",
    ).toEqual([...HOST_GLOBALS].sort());
    expect(
      inTheVm.length,
      `the VM carries ${inTheVm.length} Grid-shaped globals: ` +
        [...inTheVm].sort().join(", "),
    ).toBe(16);
    expect(inTheVm, "gmss did not reach the VM").toContain("gmss");
    probe.close();
  });

  it("runs the system Setup before Setup, and rebuilds it empty on every restart", async () => {
    // PITFALL 3, AND IT IS THE WHOLE REASON THE SYSTEM SETUP RUNS AFTER THE
    // PRISTINE SNAPSHOT. The touch library's globals are per-contact STATE -
    // `H` is the cell each contact holds - so a card remounted after a gesture
    // must not inherit them. Kept on the pristine side they would survive
    // RESTART_WIPE and the new mount would open holding a cell nobody is
    // touching.
    //
    // The probe Setup below is what proves the ORDER rather than merely the
    // presence: it reads `Q` at its own first line and raises if it is not a
    // function, so a host that ran the system Setup afterwards would reject in
    // createLuaHost instead of reaching an assertion.
    //
    // BOTH STRINGS SINCE 12.1-02: `LIBRARY_GLOBALS` now spans 255/0 and 255/6,
    // so a host given only `system` would fail the key check below on `G`,
    // `V`, `N`, `A` and `D` - which is the point of the test after this one.
    const host = await createLuaHost({
      sim: blank(),
      system: TOUCH_LIBRARY,
      systemTimer: TOUCH_LIBRARY_TIMER,
      setup:
        '--[[@cb]]if type(Q)~="function" then error("Q is "..type(Q)) end ' +
        "self.touch_cb=function(s,i,e,x,y)s.n=Q(s,i,e,x,y)or -1 end",
    });
    try {
      expect(host.errors, "the touch Setup could not see the library").toEqual(
        [],
      );
      const keys = host.globalKeys();
      for (const name of LIBRARY_GLOBALS) {
        expect(keys, `${name} is not in _G after install`).toContain(name);
      }

      // A gesture fills the contact tables. (64, 64) is LED 4 on both axes
      // under the measured map - x = 64 is KX[4] itself - so the cell is 40
      // as it was under the naive divisor.
      host.touchDown(0, 64, 64);
      host.tick();
      expect(host.selfNumber("n"), "the callback did not see cell 40").toBe(40);
      expect(
        [
          host.globalSize("H"),
          host.globalSize("T"),
          host.globalSize("P"),
          host.globalSize("B"),
        ],
        "a press must leave a contact in H and a stamp in T, and nothing in " +
          "P or B because this Setup calls neither A nor G",
      ).toEqual([1, 1, 0, 0]);

      // And a restart rebuilds them EMPTY.
      host.restart();
      expect(host.errors, "the restart raised").toEqual([]);
      const after = host.globalKeys();
      for (const name of LIBRARY_GLOBALS) {
        expect(after, `${name} is missing after restart`).toContain(name);
      }
      expect(
        [
          host.globalSize("H"),
          host.globalSize("T"),
          host.globalSize("P"),
          host.globalSize("B"),
        ],
        "a remounted card inherited a contact table from the last mount",
      ).toEqual([0, 0, 0, 0]);
      // `O` is deliberately absent: it belonged to the light layer `F`, which
      // was dropped in 12-07 for having no caller. Asserting it here would be
      // asserting about a name the library does not define.
      expect(
        host.globalSize("O"),
        "an O table appeared, so the dropped light layer came back unannounced",
      ).toBeUndefined();
      host.close();
    } catch (error) {
      host.close();
      throw error;
    }

    // WITHOUT `system`, THE KEY SET IS WHAT IT WAS. The option is additive: a
    // preset-backed host is byte-identical to a pre-12-07 one.
    const bare = await createLuaHost({
      sim: blank(),
      setup: "--[[@cb]]gtt(0,100)",
    });
    try {
      const keys = bare.globalKeys();
      for (const name of LIBRARY_GLOBALS) {
        expect(
          keys,
          `${name} reached a host that was given no system Setup`,
        ).not.toContain(name);
      }
      expect(
        bare.globalSize("H"),
        "H exists on a host with no system Setup",
      ).toBeUndefined();
    } finally {
      bare.close();
    }
  });

  it("runs the system Timer as self.tim before the system Setup, and the pair again on every restart", async () => {
    // THE MODULE'S ORDER, IN THE VM (plan 12.1-02). 255/6 is written first and
    // 255/0 closes with `self:tim()`, which runs the Timer body as the system
    // element's own method; on a page load init.lua registers every stored
    // body as a method before the system `ini` runs. The host installs the
    // Timer body as the `tim` of a stand-in `self`, then runs the Setup body,
    // so `self:tim()` really runs it.
    //
    // Purpose-built strings rather than the library, as every test in this
    // file: the Timer sets a MARKER table and defines `G`; the Setup creates
    // `B` and calls `self:tim()`. The touch Setup's first line reads `G` and
    // raises if it is not a function, so a host that ran the pair in the
    // wrong order - or after Setup - rejects in createLuaHost with
    // "attempt to call a nil value (method 'tim')" or "G is nil" instead of
    // reaching an assertion. Its second line asserts the stand-in did not
    // leak: the touch element's `self` has no `tim`.
    const TIMER = "--[[@cb]]TM={1} function G(s,i)B[i]=1 end";
    const SYSTEM = "--[[@cb]]B={} self:tim()";
    const host = await createLuaHost({
      sim: blank(),
      system: SYSTEM,
      systemTimer: TIMER,
      setup:
        '--[[@cb]]if type(G)~="function" then error("G is "..type(G)) end ' +
        'if self.tim then error("the system stand-in leaked into self") end ' +
        "self.touch_cb=function(s,i,e,x,y)G(s,i)end",
    });
    try {
      expect(host.errors, "the install raised").toEqual([]);
      const keys = host.globalKeys();
      expect(keys, "the Timer body did not run: no marker").toContain("TM");
      expect(keys, "the Timer body did not define G").toContain("G");
      expect(keys, "the Setup body did not run: no B").toContain("B");
      expect(host.globalSize("TM"), "the marker is the Timer's table").toBe(1);

      // A finger drives G, which writes B[0].
      host.touchDown(0, 64, 64);
      host.tick();
      expect(host.errors, "G raised").toEqual([]);
      expect(host.globalSize("B"), "G did not record the contact's block").toBe(
        1,
      );

      // A restart wipes B, TM and G with everything else Setup and the gesture
      // left behind, and the pair re-creates all three - B EMPTY (Pitfall 3:
      // a remounted card must not inherit a block G drew), TM back (so the
      // Timer body ran again, not merely G surviving), G a function.
      host.restart();
      expect(host.errors, "the restart raised").toEqual([]);
      expect(
        host.globalSize("B"),
        "a remounted card inherited a gradient block from the last mount",
      ).toBe(0);
      expect(host.globalKeys(), "G is missing after restart").toContain("G");
      expect(
        host.globalSize("TM"),
        "the Timer body did not run again on restart",
      ).toBe(1);
      // And still callable after the restart, on a fresh contact table.
      host.touchDown(1, 30, 30);
      host.tick();
      expect(host.errors, "G raised after the restart").toEqual([]);
      expect(host.globalSize("B"), "G did not run after the restart").toBe(1);
    } finally {
      host.close();
    }
  });

  it("installs the system Setup alone with a no-op tim, has no G, and says so on the first finger", async () => {
    // A HOST WITHOUT THE SECOND STRING STANDS FOR A MODULE WHOSE 255/6 STILL
    // HOLDS THE FIRMWARE DEFAULT (`print("tick")`, which defines nothing):
    // `self:tim()` finds a method and the install does not raise, but `G` is
    // undefined, and the first finger that reaches a `G(` call raises with
    // `G` named. That is the LOUD failure the Sandbox needs
    // (12.1-VALIDATION R-6): a card that forgot `systemTimer` fails in its
    // own smoke gate, not silently on a dark pad.
    const host = await createLuaHost({
      sim: blank(),
      system: TOUCH_LIBRARY,
      setup:
        "--[[@cb]]self.touch_cb=function(s,i,e,x,y)" +
        "G(s,i,e,x,y,0,255,255,255)local m=Q(s,i,e,x,y)end",
    });
    try {
      expect(host.errors, "the install raised without systemTimer").toEqual([]);
      const keys = host.globalKeys();
      // The 255/6 names since 12.1-08b: `N` moved to 255/0 with the map
      // (library.ts section 2), and `Z`, `Y`, `K` joined the painters.
      for (const name of ["G", "V", "Z", "Y", "K", "A", "D"]) {
        expect(
          keys,
          `${name} reached a host that was given no system Timer`,
        ).not.toContain(name);
      }
      for (const name of ["U", "W", "E", "Q", "X", "N", "KX", "KY"]) {
        expect(keys, `${name} is missing from a host given 255/0`).toContain(
          name,
        );
      }
      // The first finger.
      host.touchDown(0, 64, 64);
      host.tick();
      expect(host.errors, "the first G( call did not raise").toHaveLength(1);
      expect(
        host.errors[0],
        "the error does not name G, so a reader could not tell which string " +
          "is missing",
      ).toMatch(/global 'G'/);
      expect(host.errors[0]).toMatch(/nil value/);
    } finally {
      host.close();
    }
  });
});
