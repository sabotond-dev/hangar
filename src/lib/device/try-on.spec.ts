// The TRY ON DEVICE path: three outcomes, and one absence (D-13, D-22).
//
// Test 3 is the reason this file exists. "It never writes" is asserted twice -
// once against a transport that records every byte it is handed, and once
// against the source itself - because either half alone is a weaker gate: a
// recording proves this cycle wrote nothing, and a scan proves no cycle can.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { IDENTIFY_WINDOW_MS, TERMINATOR, ZONA_HWCFG } from "$lib/protocol";
import type { Capture, GridTransport } from "$lib/transport";
import { FakeTransport } from "$lib/transport";
import { heartbeatFrame } from "../transport/fixtures/synthetic";
import { capabilityOf, identifyOnly } from "./try-on";
import { stripComments } from "../../test-support/source";

const FIRMWARE = { major: 1, minor: 5, patch: 5 };
/** Deliberately not page 0, so a constant reached for instead of the report shows up. */
const ACTIVE_PAGE = 2;
/**
 * EN16 RevH, from the pinned package's own `grid.module_hwcfgs()` table - the
 * same table `absorbFrame` resolves a module type out of. Any non-161 entry
 * would do; this one is a real Grid module a visitor could plausibly have on
 * the cable instead of a ZONA.
 */
const EN16_HWCFG = 195;
/**
 * Two more from the same table, for the rig. `BU16_HWCFG` is a second chained
 * module and `PO16_HWCFG` is the one on the cable - a THIRD type on purpose,
 * so "it named the module reporting type 1" and "it named whichever module
 * happened to arrive first" cannot both be satisfied by the same string.
 */
const BU16_HWCFG = 131;
const PO16_HWCFG = 3;

const toHex = (bytes: number[]) =>
  bytes.map((n) => n.toString(16).padStart(2, "0")).join("");

/**
 * A transport that only ever RECEIVES. `FakeTransport`'s live responder fires
 * on a write, and this path never writes, so the frames have to arrive from a
 * capture instead. `fromCapture` reads nothing but `events`, and in `instant`
 * mode it emits every recorded chunk SYNCHRONOUSLY the moment `onData` is
 * registered - so the heartbeat is already absorbed before the first poll runs.
 * Do not add a timer here to "wait for" it; there is nothing to wait for.
 */
const rxOnly = (frames: number[][]) =>
  FakeTransport.fromCapture(
    {
      events: frames.map((f, n) => ({
        n,
        t: n,
        dir: "rx",
        kind: "chunk",
        hex: toHex([...f, TERMINATOR]),
      })),
    } as unknown as Capture,
    { speed: "instant" },
  );

const zonaHeartbeat = (hwcfg = ZONA_HWCFG) =>
  heartbeatFrame({
    sx: 0,
    sy: 0,
    type: 1,
    hwcfg,
    activePage: ACTIVE_PAGE,
    firmware: FIRMWARE,
  });

/**
 * A module further down a chained rig: its own address, and heartbeat type 0,
 * which is what makes it NOT the module on the USB cable.
 */
const chainedHeartbeat = (sx: number, hwcfg: number) =>
  heartbeatFrame({
    sx,
    sy: 0,
    type: 0,
    hwcfg,
    activePage: ACTIVE_PAGE,
    firmware: FIRMWARE,
  });

/** Zero on the first call - the window's start - and past its end on every one after. */
const clockPastTheWindow = () => {
  let calls = 0;
  return () => (calls++ === 0 ? 0 : IDENTIFY_WINDOW_MS + 1);
};

/** The window never elapses; every case using this resolves on the first poll. */
const frozenClock = () => 0;

const noSleep = async () => {};

const tryOnSource = () =>
  readFileSync(fileURLToPath(new URL("./try-on.ts", import.meta.url)), "utf8");

/** Counts what the path asked of the transport, without changing what it gets. */
function spy(inner: FakeTransport) {
  const calls = { onData: 0, onClose: 0, write: 0 };
  const wrapped: GridTransport = {
    get isOpen() {
      return inner.isOpen;
    },
    write: async (data: Uint8Array) => {
      calls.write++;
      await inner.write(data);
    },
    onData: (cb) => {
      calls.onData++;
      inner.onData(cb);
    },
    onClose: (cb) => {
      calls.onClose++;
      inner.onClose(cb);
    },
    close: () => inner.close(),
  };
  return { wrapped, calls };
}

describe("TRY ON DEVICE: connect and identify, never write (D-13, D-22)", () => {
  it("reads the capability from the environment, and absence beats insecurity", () => {
    // Absence wins on purpose: "this browser cannot talk to hardware" names a
    // fix the visitor can act on, and "this page needs HTTPS" does not when
    // there is no Web Serial to secure in the first place.
    expect(capabilityOf({ hasSerial: false, secure: true })).toBe(
      "unsupported",
    );
    expect(capabilityOf({ hasSerial: true, secure: false })).toBe("insecure");
    expect(capabilityOf({ hasSerial: true, secure: true })).toBe("ok");
    expect(capabilityOf({ hasSerial: false, secure: false })).toBe(
      "unsupported",
    );
  });

  it("names the ZONA from its own heartbeat, with the firmware and the page it reported", async () => {
    const transport = rxOnly([zonaHeartbeat()]);
    const outcome = await identifyOnly(transport, {
      now: frozenClock,
      sleep: noSleep,
    });

    expect(outcome.kind, "a ZONA heartbeat identifies a ZONA").toBe(
      "identified",
    );
    if (outcome.kind !== "identified") return;
    expect(outcome.identity.zona.moduleType).toBe("ZONA");
    expect(outcome.identity.zona.hwcfg).toBe(ZONA_HWCFG);
    expect(outcome.identity.zona.firmware, "the firmware it reported").toEqual(
      FIRMWARE,
    );
    expect(outcome.identity.activePage, "the page it reported").toBe(
      ACTIVE_PAGE,
    );
    expect(
      outcome.identity.otherModules,
      "nothing else was on the bus",
    ).toEqual([]);
  });

  it("writes nothing across a full open, identify and close cycle, and cannot", async () => {
    // Half one: this cycle wrote nothing.
    const transport = rxOnly([zonaHeartbeat()]);
    const outcome = await identifyOnly(transport, {
      now: frozenClock,
      sleep: noSleep,
    });
    await transport.close();
    expect(outcome.kind, "the cycle really ran").toBe("identified");
    expect(transport.writes, "TRY ON DEVICE wrote to the module").toHaveLength(
      0,
    );

    // Half two: no cycle can. The needle is assembled from fragments so this
    // spec's own source does not contain the thing it forbids, in the style of
    // src/lib/protocol/forbidden-instructions.spec.ts.
    const source = stripComments(tryOnSource());
    expect(source.length, "the source was actually read").toBeGreaterThan(0);
    for (const needle of [
      [".", "write("].join(""),
      "RequestQueue",
      "hostHeartbeat",
      "sendConfig",
      "storePage",
      "fetchConfig",
    ]) {
      expect(source.includes(needle), `try-on.ts reaches ${needle}`).toBe(
        false,
      );
    }
  });

  it("a module that is not a ZONA is its own outcome, carrying what it said it was", async () => {
    const transport = rxOnly([zonaHeartbeat(EN16_HWCFG)]);
    const outcome = await identifyOnly(transport, {
      now: clockPastTheWindow(),
      sleep: noSleep,
    });

    expect(outcome.kind, "something answered, so this is not silence").toBe(
      "not-zona",
    );
    if (outcome.kind !== "not-zona") return;
    expect(outcome.moduleType, "the module type the heartbeat reported").toBe(
      "EN16",
    );
  });

  it("a rig refuses by naming the module on the cable, not the first one that spoke", async () => {
    // Arrival order puts two chained, type-0 modules first, so `seen[0]` is
    // the EN16 - a module the visitor did not plug into anything. The one on
    // the USB cable is the one reporting heartbeat type 1
    // (grid_decode.c:695-700), and it is a THIRD module type here so the two
    // possible answers cannot be satisfied by the same string.
    const transport = rxOnly([
      chainedHeartbeat(1, EN16_HWCFG),
      chainedHeartbeat(2, BU16_HWCFG),
      zonaHeartbeat(PO16_HWCFG),
    ]);
    const outcome = await identifyOnly(transport, {
      now: clockPastTheWindow(),
      sleep: noSleep,
    });

    expect(outcome.kind, "three modules answered, so this is not silence").toBe(
      "not-zona",
    );
    if (outcome.kind !== "not-zona") return;
    expect(outcome.moduleType, "the module reporting heartbeat type 1").toBe(
      "PO16",
    );
    expect(
      outcome.moduleType,
      "the refusal named the first module by arrival order",
    ).not.toBe("EN16");
  });

  it("a port that answers nothing at all is a different outcome from the wrong module", async () => {
    const transport = rxOnly([]);
    const outcome = await identifyOnly(transport, {
      now: clockPastTheWindow(),
      sleep: noSleep,
    });

    expect(outcome.kind, "nothing was seen, so nothing can be named").toBe(
      "silent",
    );
  });

  it("registers exactly one data callback and never reaches the transport's write", async () => {
    const { wrapped, calls } = spy(rxOnly([zonaHeartbeat()]));
    const outcome = await identifyOnly(wrapped, {
      now: frozenClock,
      sleep: noSleep,
    });

    expect(outcome.kind, "the path ran to a result").toBe("identified");
    expect(calls.onData, "one frame pump, not one per poll").toBe(1);
    expect(calls.write, "the path asked the transport to write").toBe(0);
  });
});
