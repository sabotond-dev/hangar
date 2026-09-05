// The device session, driven from node by a fake serial and a fake port (D-14).
//
// WHY THIS FILE IS session.spec.ts AND NOT session.svelte.spec.ts. The module
// under test is session.svelte.ts, and the obvious name for its spec matches
// vite.config.ts's `server` project exclude, `src/**/*.svelte.{test,spec}.{js,ts}`,
// exactly. A spec by that name would be collected by NOTHING in
// `npm run test:quick`, and the suite would be green and vacuous. This name
// matches the include and misses the exclude; the file count moving by one in
// the count gate is what proves it was collected.
//
// EVERY TEST CONSTRUCTS ITS OWN `new DeviceSession()`. The exported `session`
// singleton exists for components - one instance per page load is D-05 - and
// this file never imports it: a suite that shared it would carry one test's
// port, phase and in-flight guard into the next, and would need a reset hook
// the production class has no reason to have.
//
// Eight gates, in the plan's order: the capability decided in the calling
// frame; a granted ZONA offered and never opened; an empty list meaning "not
// plugged in"; two controls and one chooser; a THROWN activation failure
// caught at the call site; the failure map, one row each; a real hardware
// capture identifying the module; and a rig refused by name with the port
// closed afterwards. Three of those - the double click, the synchronous throw
// and the rig - no browser can produce on demand, which is the reason the
// session's serial surface and transport factory are injectable at all.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { IDENTIFY_WINDOW_MS, TERMINATOR, ZONA_HWCFG } from "$lib/protocol";
import { ZONA_USB } from "$lib/protocol/usb";
import type { Capture } from "$lib/transport";
import { FakeTransport } from "$lib/transport";
import { heartbeatFrame } from "../transport/fixtures/synthetic";
import { CONNECT_LABEL, NAMED_STATES } from "./session-copy";
import { DeviceSession, type SerialLike } from "./session.svelte";
import { TRY_ON_LABEL } from "./try-on";

// ---------------------------------------------------------------------------
// The capture, and what the hardware run recorded in it.

/**
 * The Phase 2 hardware capture: 119 rx chunks at the boundaries a real 2 Mbaud
 * USB CDC link produced. Its `identity` block is what the page identified on
 * the day, so the assertions below are against what the fixture holds rather
 * than against a number typed into this file.
 */
const HARDWARE = JSON.parse(
  readFileSync(
    new URL(
      "../transport/fixtures/zona-hardware-a-hb-on-pace-0.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Capture & {
  identity: {
    moduleType: string;
    firmware: { major: number; minor: number; patch: number };
    activePage: number;
  };
};

const FIRMWARE = { major: 1, minor: 5, patch: 5 };
const ACTIVE_PAGE = 2;
/** The same three non-ZONA hwcfgs try-on.spec.ts verified against the pinned package. */
const EN16_HWCFG = 195;
const BU16_HWCFG = 131;
const PO16_HWCFG = 3;

const toHex = (bytes: number[]) =>
  bytes.map((n) => n.toString(16).padStart(2, "0")).join("");

/** A transport that only ever RECEIVES; see try-on.spec.ts for why instant mode needs no timer. */
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

const onCable = (hwcfg: number) =>
  heartbeatFrame({
    sx: 0,
    sy: 0,
    type: 1,
    hwcfg,
    activePage: ACTIVE_PAGE,
    firmware: FIRMWARE,
  });

const chained = (sx: number, hwcfg: number) =>
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
const frozenClock = () => 0;
const noSleep = async () => {};

// ---------------------------------------------------------------------------
// The fakes.

interface PortCalls {
  open: number;
  close: number;
  forget: number;
}

interface FakePortOptions {
  info?: SerialPortInfo;
  /** Absent means the property does not exist at all - Chrome 89-129. */
  connected?: boolean;
  /** What open() throws, if anything. */
  openThrows?: DOMException;
  /** Whether the port has forget() at all - Chrome 103+ / Firefox 151+. */
  hasForget?: boolean;
}

/**
 * A SerialPort that records what was asked of it. `readable` is non-null
 * while the port is open and null otherwise, as the real one's is, because
 * the session reads it to decide whether a close is still owed.
 */
function fakePort(opts: FakePortOptions = {}) {
  const calls: PortCalls = { open: 0, close: 0, forget: 0 };
  let readable: object | null = null;
  const port: Record<string, unknown> = {
    getInfo: () => opts.info ?? { ...ZONA_USB },
    open: async () => {
      calls.open++;
      if (opts.openThrows) throw opts.openThrows;
      readable = {};
    },
    close: async () => {
      calls.close++;
      readable = null;
    },
    get readable() {
      return readable;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  if (opts.hasForget !== false) {
    port.forget = async () => {
      calls.forget++;
    };
  }
  if (opts.connected !== undefined) port.connected = opts.connected;
  return {
    port: port as unknown as SerialPort,
    calls,
    setConnected(value: boolean) {
      port.connected = value;
    },
  };
}

interface SerialCalls {
  requestPort: number;
  getPorts: number;
}

/**
 * A `navigator.serial` that records requestPort() calls, resolves or rejects
 * - or THROWS - on cue, returns a getPorts() list on cue, and keeps its
 * listeners in a map so plan 06-04 can fire events at them.
 */
function fakeSerial(opts: {
  granted?: SerialPort[];
  /** Called on every requestPort(); a synchronous throw here propagates synchronously. */
  pick?: () => Promise<SerialPort>;
}) {
  const calls: SerialCalls = { requestPort: 0, getPorts: 0 };
  const listeners = new Map<string, Set<(ev: Event) => void>>();
  const serial: SerialLike = {
    requestPort: () => {
      calls.requestPort++;
      if (!opts.pick) throw new Error("the test gave requestPort no cue");
      return opts.pick();
    },
    getPorts: async () => {
      calls.getPorts++;
      return opts.granted ?? [];
    },
    addEventListener: (type, listener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(listener);
    },
    removeEventListener: (type, listener) => {
      listeners.get(type)?.delete(listener);
    },
  };
  return { serial, calls, listeners };
}

/** A transport factory in the shape of the real one: open the port, then wrap it. */
const opening =
  (transport: FakeTransport) =>
  async (port: SerialPort): Promise<FakeTransport> => {
    await port.open({ baudRate: 2_000_000 });
    return transport;
  };

const rejecting = (name: string, message: string) => () =>
  Promise.reject(new DOMException(message, name));

/** Poll until the predicate holds. setTimeout, never setInterval. */
async function waitFor(
  predicate: () => boolean,
  what: string,
  timeoutMs = 5000,
): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(`timed out waiting for ${what}`);
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 2));
  }
}

const settled = (s: DeviceSession) =>
  s.phase !== "starting" &&
  s.phase !== "choosing" &&
  s.phase !== "opening" &&
  s.phase !== "identifying";

// ---------------------------------------------------------------------------

describe("DeviceSession: capability, the offer, the chooser, identification (D-05, D-06, CONN-01, CONN-05, CONN-06, CONN-07)", () => {
  it("decides the capability in the calling frame, with nothing attached and nothing asked", () => {
    const unsupported = fakeSerial({});
    const a = new DeviceSession();
    expect(a.phase, "the value every prerendered page ships").toBe("starting");
    a.start({ hasSerial: false, secure: true, serial: unsupported.serial });
    // No await between start() and these lines: the state is decided in the
    // frame that called start(), and the block renders in that frame too.
    expect(a.phase).toBe("unsupported");
    expect(a.failureFor(CONNECT_LABEL)?.title).toBe(
      "This browser cannot talk to hardware",
    );

    const insecure = fakeSerial({});
    const b = new DeviceSession();
    b.start({ hasSerial: true, secure: false, serial: insecure.serial });
    expect(b.phase).toBe("insecure");
    const block = b.failureFor(TRY_ON_LABEL);
    expect(block?.title).toBe("This page needs HTTPS");
    expect(block?.steps, "the steps name the surface's own button").toContain(
      `Click ${TRY_ON_LABEL} again`,
    );

    for (const { calls, listeners } of [unsupported, insecure]) {
      expect(
        calls.getPorts,
        "getPorts() was asked on an incapable browser",
      ).toBe(0);
      expect(calls.requestPort).toBe(0);
      expect(listeners.size, "a listener was attached").toBe(0);
    }
  });

  it("offers a granted, attached ZONA and never opens it", async () => {
    // A port with NO `connected` property at all is Chrome 89-129, and it
    // must be kept: the filter is `!== false`, never `=== true`.
    const older = fakePort();
    const a = new DeviceSession();
    const serialA = fakeSerial({ granted: [older.port] });
    a.start({ hasSerial: true, secure: true, serial: serialA.serial });
    await waitFor(() => a.phase !== "starting", "the offer to settle");
    expect(a.phase, "a granted ZONA is one click away").toBe("detected");
    expect(older.calls.open, "start() opened the port").toBe(0);
    expect(a.canForget, "the fake has forget(), so the control renders").toBe(
      true,
    );
    expect(serialA.calls.getPorts).toBe(1);
    expect(serialA.calls.requestPort, "the offer asked the chooser").toBe(0);

    // And one that reports `connected: true`, the newer shape.
    const newer = fakePort({ connected: true });
    const b = new DeviceSession();
    b.start({
      hasSerial: true,
      secure: true,
      serial: fakeSerial({ granted: [newer.port] }).serial,
    });
    await waitFor(() => b.phase !== "starting", "the offer to settle");
    expect(b.phase).toBe("detected");
    expect(newer.calls.open).toBe(0);
    expect(b.failureFor(CONNECT_LABEL), "detected is not a failure").toBeNull();
  });

  it("reads an empty list as not plugged in, never as no grant", async () => {
    const a = new DeviceSession();
    a.start({
      hasSerial: true,
      secure: true,
      serial: fakeSerial({ granted: [] }).serial,
    });
    await waitFor(() => a.phase !== "starting", "the offer to settle");
    expect(a.phase).toBe("idle");
    expect(a.failureFor(CONNECT_LABEL), "idle has no block").toBeNull();
    expect(
      (NAMED_STATES as readonly string[]).includes(a.phase),
      "idle is not a named state",
    ).toBe(false);

    // A granted port the OS reports as detached is the same answer: it is
    // not in reach, and nothing about the grant is said.
    const detached = fakePort({ connected: false });
    const b = new DeviceSession();
    b.start({
      hasSerial: true,
      secure: true,
      serial: fakeSerial({ granted: [detached.port] }).serial,
    });
    await waitFor(() => b.phase !== "starting", "the offer to settle");
    expect(b.phase).toBe("idle");
    expect(detached.calls.open).toBe(0);
  });

  it("two controls, one chooser: a second connect() while one is in flight is a no-op", async () => {
    let reject: ((err: unknown) => void) | undefined;
    const pending = new Promise<SerialPort>((_, rej) => {
      reject = rej;
    });
    const serial = fakeSerial({ granted: [], pick: () => pending });
    const s = new DeviceSession();
    s.start({ hasSerial: true, secure: true, serial: serial.serial });
    await waitFor(() => s.phase === "idle", "idle");

    s.connect();
    s.connect();
    expect(
      serial.calls.requestPort,
      "the header and the panel both fired, and the chooser opened twice",
    ).toBe(1);
    expect(s.phase).toBe("choosing");

    // Let the chooser close, and the guard release: a third click asks again.
    reject?.(
      new DOMException("No port selected by the user.", "NotFoundError"),
    );
    await waitFor(() => s.phase === "cancelled", "cancelled");
    s.connect();
    expect(serial.calls.requestPort, "the guard never cleared").toBe(2);
  });

  it("catches a THROWN activation failure at the call site and names it", async () => {
    const message =
      "Must be handling a user gesture to show a permission request.";
    const serial = fakeSerial({
      granted: [],
      pick: () => {
        // Thrown, not rejected: the browser's synchronous SecurityError.
        throw new DOMException(message, "SecurityError");
      },
    });
    const s = new DeviceSession();
    s.start({ hasSerial: true, secure: true, serial: serial.serial });
    await waitFor(() => s.phase === "idle", "idle");

    expect(() => s.connect(), "the throw escaped connect()").not.toThrow();
    expect(s.phase, "a named state, decided synchronously").toBe("unknown");
    expect(s.failureKind).toBe("unknown");
    expect(s.failureRaw, "the raw message is carried, never swallowed").toBe(
      message,
    );
    expect(s.failureFor(CONNECT_LABEL)?.detail).toContain(message);

    // The guard was released on the way out, so the next click is real.
    expect(() => s.connect()).not.toThrow();
    expect(serial.calls.requestPort).toBe(2);
  });

  it("maps every failure onto its phase, one row each", async () => {
    const drive = async (
      pick: () => Promise<SerialPort>,
      openTransport?: (port: SerialPort) => Promise<FakeTransport>,
    ) => {
      const s = new DeviceSession();
      s.start({
        hasSerial: true,
        secure: true,
        serial: fakeSerial({ granted: [], pick }).serial,
        openTransport,
      });
      await waitFor(() => s.phase === "idle", "idle");
      s.connect();
      await waitFor(() => settled(s), "the failure to land");
      return s;
    };

    // NotFoundError: the chooser was closed.
    const cancelled = await drive(
      rejecting("NotFoundError", "No port selected by the user."),
    );
    expect(cancelled.phase).toBe("cancelled");
    expect(cancelled.permissionDeclined).toBe(false);
    expect(cancelled.failureFor(CONNECT_LABEL)?.title).toBe(
      "You closed the chooser",
    );

    // NotAllowedError: the permission prompt was declined (Y-06).
    const declined = await drive(
      rejecting("NotAllowedError", "Permission denied."),
    );
    expect(declined.phase).toBe("cancelled");
    expect(declined.permissionDeclined, "the one behavioural modifier").toBe(
      true,
    );

    // NetworkError during open() with connected === false: gone between the
    // pick and the open. The S6 open failure, through the transport's
    // `unplugged` key - and NOT the live session's unplugged state.
    const gone = fakePort({
      connected: false,
      openThrows: new DOMException(
        "Failed to open serial port.",
        "NetworkError",
      ),
    });
    const unplugged = await drive(
      () => Promise.resolve(gone.port),
      opening(rxOnly([])),
    );
    expect(unplugged.phase).toBe("unplugged-at-open");
    expect(unplugged.failureKind).toBe("unplugged");
    expect(unplugged.failureFor(CONNECT_LABEL)?.title).toBe(
      "The ZONA is not there any more",
    );

    // The same NetworkError with the port still attached, and with no
    // `connected` property at all: another program is holding it.
    for (const port of [
      fakePort({
        connected: true,
        openThrows: new DOMException(
          "Failed to open serial port.",
          "NetworkError",
        ),
      }),
      fakePort({
        openThrows: new DOMException(
          "Failed to open serial port.",
          "NetworkError",
        ),
      }),
    ]) {
      const busy = await drive(
        () => Promise.resolve(port.port),
        opening(rxOnly([])),
      );
      expect(busy.phase).toBe("port-busy");
      expect(busy.failureFor(CONNECT_LABEL)?.steps[0]).toContain("Grid Editor");
    }

    // InvalidStateError: HANGAR's own bug wearing a DOMException. It renders
    // through the unknown row with the already-connecting sentence and NO
    // steps, and the key is kept so the block can say that.
    const racing = fakePort({
      openThrows: new DOMException(
        "A call to open() is already in progress.",
        "InvalidStateError",
      ),
    });
    const already = await drive(
      () => Promise.resolve(racing.port),
      opening(rxOnly([])),
    );
    expect(already.phase).toBe("unknown");
    expect(already.failureKind).toBe("already-open");
    const block = already.failureFor(CONNECT_LABEL);
    expect(block?.detail).toBe("HANGAR is already connecting — one moment.");
    expect(block?.steps, "there is nothing for the visitor to do").toEqual([]);
  });

  it("identifies the module from a real hardware capture, and writes nothing", async () => {
    const transport = FakeTransport.fromCapture(HARDWARE, { speed: "instant" });
    const picked = fakePort();
    const s = new DeviceSession();
    s.start({
      hasSerial: true,
      secure: true,
      serial: fakeSerial({
        granted: [],
        pick: () => Promise.resolve(picked.port),
      }).serial,
      openTransport: opening(transport),
      now: frozenClock,
      sleep: noSleep,
    });
    await waitFor(() => s.phase === "idle", "idle");

    s.connect();
    await waitFor(() => settled(s), "identification");
    expect(s.phase, "the captured ZONA identifies itself").toBe("connected");
    expect(s.identity?.zona.moduleType).toBe("ZONA");
    expect(s.identity?.zona.hwcfg).toBe(ZONA_HWCFG);
    expect(s.identity?.zona.firmware, "the firmware the run recorded").toEqual(
      HARDWARE.identity.firmware,
    );
    expect(s.identity?.activePage, "the active page the run recorded").toBe(
      HARDWARE.identity.activePage,
    );
    // What the fixture holds, so a reader of this file knows without opening it.
    expect(HARDWARE.identity.firmware).toEqual({
      major: 1,
      minor: 5,
      patch: 5,
    });
    expect(HARDWARE.identity.activePage).toBe(3);
    expect(s.identity?.otherModules).toEqual([]);
    expect(
      s.failureFor(CONNECT_LABEL),
      "connected is not a failure",
    ).toBeNull();

    expect(transport.writes, "the session wrote to the module").toHaveLength(0);
    expect(picked.calls.open, "opened exactly once").toBe(1);
    expect(picked.calls.close, "a connected port is held, not closed").toBe(0);
  });

  it("refuses a rig with no ZONA by naming the module on the cable, and closes the port", async () => {
    // Two chained type-0 modules first, so arrival order would name the EN16;
    // the module on the USB cable is the type-1 PO16 (grid_decode.c:695-700).
    const transport = rxOnly([
      chained(1, EN16_HWCFG),
      chained(2, BU16_HWCFG),
      onCable(PO16_HWCFG),
    ]);
    const picked = fakePort();
    const s = new DeviceSession();
    s.start({
      hasSerial: true,
      secure: true,
      serial: fakeSerial({
        granted: [],
        pick: () => Promise.resolve(picked.port),
      }).serial,
      openTransport: opening(transport),
      now: clockPastTheWindow(),
      sleep: noSleep,
    });
    await waitFor(() => s.phase === "idle", "idle");

    s.connect();
    await waitFor(() => settled(s), "the refusal");
    expect(s.phase).toBe("not-zona");
    expect(s.refusedModule).toBe("PO16");

    const header = s.failureFor(CONNECT_LABEL);
    expect(header?.title).toBe("That module is not a ZONA");
    expect(header?.detail, "names the module on the cable").toContain("PO16");
    expect(header?.detail).not.toContain("EN16");
    expect(
      header?.steps,
      "Y-14's amended steps, with the header's label",
    ).toEqual(["Plug in a ZONA", `Click ${CONNECT_LABEL} again`]);
    expect(s.failureFor(TRY_ON_LABEL)?.steps[1], "and the panel's label").toBe(
      `Click ${TRY_ON_LABEL} again`,
    );

    // Both recovery lists say try again, which a port this page still held
    // would make impossible.
    expect(picked.calls.close, "the port was left open after the refusal").toBe(
      1,
    );
    expect(transport.isOpen, "the transport was left open").toBe(false);
    expect(transport.writes).toHaveLength(0);
  });
});
