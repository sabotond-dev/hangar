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
// Seventeen gates, in the plans' order. Eight from 06-03: the capability
// decided in the calling frame; a granted ZONA offered and never opened; an
// empty list meaning "not plugged in"; two controls and one chooser; a THROWN
// activation failure caught at the call site; the failure map, one row each; a
// real hardware capture identifying the module; and a rig refused by name with
// the port closed afterwards. Seven from 06-04, the half the hardware drives:
// an unplug that is immediate; a replug that arrives as a DIFFERENT port
// object and is adopted; arrivals that are ignored; the watchdog firing on the
// missed disconnect and on nothing else; the identity folding for the life of
// the connection; forget() closing before it revokes; and zero writes, twice.
// Two from 06-09, the voice: three transitions in one window are ONE utterance
// and a fold is none; and a held utterance waits, is replaced by a later one,
// and is spoken once when the hold lifts. Most of those no browser can produce
// on demand either, and the fake serial keeps its listeners in a map precisely
// so a test can fire the events itself.
//
// TESTS 12, 16 AND 17 FAKE setTimeout AND NOTHING ELSE. The watchdog and the
// live region's coalescer are both setTimeout chains, so that is the one timer
// those tests need to own; the clock the watchdog compares against is the
// session's INJECTED `now`, never a faked performance.now(). waitFor() yields
// through setImmediate for exactly this reason - it has to keep polling while
// setTimeout is frozen.
//
// HOW THE VOICE IS COUNTED. `speech` is a $state field, which the server
// transform compiles to a PLAIN own property (06-01's spike), so recordSpeech
// replaces it on one instance with an accessor that logs every non-empty
// write. The empty writes are filtered on purpose: #say empties the region
// when it queues a line so that a repeated sentence is still a DOM change,
// and that clearing is the mechanism, not an utterance.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  IDENTIFY_WINDOW_MS,
  MODULE_GONE_MS,
  TERMINATOR,
  ZONA_HWCFG,
} from "$lib/protocol";
import { ZONA_USB } from "$lib/protocol/usb";
import type { Capture, GridTransport } from "$lib/transport";
import { FakeTransport } from "$lib/transport";
import { heartbeatFrame } from "../transport/fixtures/synthetic";
import {
  CONNECT_LABEL,
  LIVE_DETECTED,
  LIVE_DISCONNECTED,
  LIVE_UNPLUGGED,
  NAMED_STATES,
  liveConnected,
} from "./session-copy";
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

const onCable = (hwcfg: number, activePage = ACTIVE_PAGE) =>
  heartbeatFrame({
    sx: 0,
    sy: 0,
    type: 1,
    hwcfg,
    activePage,
    firmware: FIRMWARE,
  });

/** The ZONA's own heartbeat, page report included, as the fold sees it four times a second. */
const zonaHeartbeat = (activePage = ACTIVE_PAGE) =>
  onCable(ZONA_HWCFG, activePage);

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

/** A clock the test moves by hand; the session's `now` and nothing else reads it. */
const movableClock = () => {
  let t = 0;
  return {
    now: () => t,
    set(value: number) {
      t = value;
    },
  };
};

/** try-on.spec.ts's comment stripper, for the static half of test 15. */
const strip = (t: string) =>
  t
    .replace(/^[ ]*[/][/].*$/gm, "")
    .replace(/[/][*][^]*?[*][/]/g, "")
    .replace(/<!--[^]*?-->/g, "");

const sessionSource = () =>
  readFileSync(new URL("./session.svelte.ts", import.meta.url), "utf8");

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
 * A SerialPort that records what was asked of it - the counts, and the ORDER,
 * which is what test 14's close-before-forget assertion reads. `readable` is
 * non-null while the port is open and null otherwise, as the real one's is,
 * because the session reads it to decide whether a close is still owed.
 */
function fakePort(opts: FakePortOptions = {}) {
  const calls: PortCalls = { open: 0, close: 0, forget: 0 };
  const order: (keyof PortCalls)[] = [];
  let readable: object | null = null;
  const port: Record<string, unknown> = {
    getInfo: () => opts.info ?? { ...ZONA_USB },
    open: async () => {
      calls.open++;
      order.push("open");
      if (opts.openThrows) throw opts.openThrows;
      readable = {};
    },
    close: async () => {
      calls.close++;
      order.push("close");
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
      order.push("forget");
    };
  }
  if (opts.connected !== undefined) port.connected = opts.connected;
  return {
    port: port as unknown as SerialPort,
    calls,
    order,
    setConnected(value: boolean) {
      port.connected = value;
    },
  };
}

/** A port that is a Grid module but not a ZONA: the bootloader identity, which the picker never lists. */
const notZonaPort = () =>
  fakePort({ info: { usbVendorId: 0x303a, usbProductId: 0x8122 } });

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

/** Fire a navigator.serial event at every listener the session attached, with the port as its target. */
const fire = (
  serial: ReturnType<typeof fakeSerial>,
  type: "connect" | "disconnect",
  port: SerialPort,
) =>
  serial.listeners
    .get(type)
    ?.forEach((listener) => listener({ target: port } as unknown as Event));

/** A transport factory in the shape of the real one: open the port, then wrap it. */
const opening =
  (transport: GridTransport) =>
  async (port: SerialPort): Promise<GridTransport> => {
    await port.open({ baudRate: 2_000_000 });
    return transport;
  };

/** The same shape, serving a FRESH transport per open - a replug opens a second one. */
const openingEach =
  (make: () => GridTransport, made: GridTransport[] = []) =>
  async (port: SerialPort): Promise<GridTransport> => {
    await port.open({ baudRate: 2_000_000 });
    const transport = make();
    made.push(transport);
    return transport;
  };

/**
 * A transport the TEST feeds, for the half of the session that runs after
 * identification. `initial` is delivered synchronously the first time a data
 * callback is registered, exactly as FakeTransport's instant replay is, so
 * identifyOnly resolves on its first poll; everything after that arrives
 * through push(), whenever the test says, to whichever callback registered
 * LAST - which is what "one callback, the last registration owns the stream"
 * means for the fold.
 */
function pushable(initial: number[][] = []) {
  const writes: Uint8Array[] = [];
  let callback: ((chunk: Uint8Array) => void) | undefined;
  let open = true;
  let delivered = false;
  const push = (frame: number[]) =>
    callback?.(Uint8Array.from([...frame, TERMINATOR]));
  const transport: GridTransport = {
    get isOpen() {
      return open;
    },
    write: async (data) => {
      writes.push(data);
    },
    onData: (next) => {
      callback = next;
      if (delivered) return;
      delivered = true;
      for (const frame of initial) push(frame);
    },
    onClose: () => {},
    close: async () => {
      open = false;
    },
  };
  return { transport, writes, push };
}

const rejecting = (name: string, message: string) => () =>
  Promise.reject(new DOMException(message, name));

/**
 * Poll until the predicate holds. The yield is setImmediate rather than a
 * setTimeout so the poll keeps running while test 12 has setTimeout faked; an
 * interval appears nowhere in this file.
 */
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
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

/**
 * The road to `connected` every 06-04 gate starts on: a granted, attached port
 * offered by start(), then one click. The chooser is never asked, so the fake
 * serial has no pick cue and any requestPort() call would throw.
 */
async function connectGranted(
  port: ReturnType<typeof fakePort>,
  openTransport: (port: SerialPort) => Promise<GridTransport>,
  now: () => number = frozenClock,
) {
  const serial = fakeSerial({ granted: [port.port] });
  const s = new DeviceSession();
  s.start({
    hasSerial: true,
    secure: true,
    serial: serial.serial,
    openTransport,
    now,
    sleep: noSleep,
  });
  await waitFor(() => s.phase === "detected", "the offer");
  s.connect();
  await waitFor(() => settled(s), "identification");
  expect(s.phase, "the road to connected").toBe("connected");
  return { s, serial };
}

const settled = (s: DeviceSession) =>
  s.phase !== "starting" &&
  s.phase !== "choosing" &&
  s.phase !== "opening" &&
  s.phase !== "identifying";

/**
 * Every non-empty write to `speech`, in order - the utterances the one live
 * region would have announced. See the header for why the field can be
 * replaced with an accessor and why the empty writes are not counted.
 */
function recordSpeech(s: DeviceSession): string[] {
  const utterances: string[] = [];
  let value = s.speech;
  Object.defineProperty(s, "speech", {
    configurable: true,
    enumerable: true,
    get: () => value,
    set: (next: string) => {
      value = next;
      if (next !== "") utterances.push(next);
    },
  });
  return utterances;
}

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

    // A BARE start() - the component's form - where there is no window is the
    // prerender trap, and it throws rather than deciding. Node 21+ has a
    // global navigator without serial, so without this guard a module-scope
    // start() in the layout would prerender every page as `unsupported` with
    // the build green (plan 06-09 observed exactly that).
    const bare = new DeviceSession();
    expect(() => bare.start()).toThrow(/navigator/);
    expect(bare.phase, "a refused start decided a phase").toBe("starting");
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
      openTransport?: (port: SerialPort) => Promise<GridTransport>,
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

    // A connected session owns a watchdog timer; no instance outlives its test.
    await s.disconnect();
    expect(s.phase).toBe("idle");
    expect(picked.calls.close, "disconnect() closes the port").toBe(1);
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

  // -------------------------------------------------------------------------
  // 06-04: the half the hardware drives.

  it("an unplug of a live session is immediate, and a detected port that leaves returns to idle", async () => {
    const transport = FakeTransport.fromCapture(HARDWARE, { speed: "instant" });
    const port = fakePort({ connected: true });
    const { s, serial } = await connectGranted(port, opening(transport));

    // The browser fires disconnect AT THE OBJECT the session holds, with its
    // `connected` already false. No await between the event and the asserts:
    // the header changes in this turn, before any click and without waiting
    // for a failed write.
    port.setConnected(false);
    fire(serial, "disconnect", port.port);
    expect(s.phase).toBe("unplugged-while-connected");
    expect(s.identity).toBeNull();
    expect(s.failureFor(CONNECT_LABEL)?.detail).toBe(
      "The ZONA was unplugged. Nothing was written.",
    );
    expect(s.canForget, "S5 still offers to forget the module").toBe(true);
    expect(transport.writes).toHaveLength(0);
    await waitFor(() => port.calls.close === 1, "the port to close");
    expect(transport.isOpen).toBe(false);

    // A disconnect for some OTHER permitted device is not ours.
    const other = fakePort({ connected: true });
    const b = new DeviceSession();
    const serialB = fakeSerial({
      granted: [fakePort({ connected: true }).port],
    });
    b.start({ hasSerial: true, secure: true, serial: serialB.serial });
    await waitFor(() => b.phase === "detected", "the offer");
    fire(serialB, "disconnect", other.port);
    expect(b.phase, "a foreign port's disconnect moved the phase").toBe(
      "detected",
    );

    // A detected port that leaves before it was ever opened: idle, not S5.
    // Phase 4's sentence says "Nothing was written" about a session that
    // existed, and there was none.
    const detected = fakePort({ connected: true });
    const c = new DeviceSession();
    const serialC = fakeSerial({
      granted: [detected.port],
      pick: rejecting("NotFoundError", "No port selected by the user."),
    });
    c.start({ hasSerial: true, secure: true, serial: serialC.serial });
    await waitFor(() => c.phase === "detected", "the offer");
    detected.setConnected(false);
    fire(serialC, "disconnect", detected.port);
    expect(c.phase).toBe("idle");
    expect(c.failureFor(CONNECT_LABEL)).toBeNull();
    expect(c.canForget).toBe(false);
    expect(detected.calls.open).toBe(0);
    // And the dead object is not reopened: the next click asks the chooser.
    c.connect();
    await waitFor(() => settled(c), "the chooser");
    expect(serialC.calls.requestPort, "the dead port was reused").toBe(1);
    expect(detected.calls.open).toBe(0);
  });

  it("the replug adopts the new port object, and one click reconnects with no chooser", async () => {
    const transports: GridTransport[] = [];
    const first = fakePort({ connected: true });
    const { s, serial } = await connectGranted(
      first,
      openingEach(
        () => FakeTransport.fromCapture(HARDWARE, { speed: "instant" }),
        transports,
      ),
    );

    first.setConnected(false);
    fire(serial, "disconnect", first.port);
    expect(s.phase).toBe("unplugged-while-connected");
    await waitFor(() => first.calls.close === 1, "the port to close");

    // Chromium mints a fresh token for a re-added wired port, so `connect`
    // fires at a DIFFERENT SerialPort object carrying the same USB identity.
    const replugged = fakePort({ connected: true });
    expect(replugged.port, "the fixture reused the object").not.toBe(
      first.port,
    );
    fire(serial, "connect", replugged.port);
    expect(s.phase, "one click away again").toBe("detected");
    expect(s.failureFor(CONNECT_LABEL)).toBeNull();
    expect(s.canForget).toBe(true);
    expect(replugged.calls.open, "the replug opened the port by itself").toBe(
      0,
    );

    s.connect();
    await waitFor(() => settled(s), "the reconnect");
    expect(s.phase).toBe("connected");
    expect(s.identity?.zona.moduleType).toBe("ZONA");
    expect(replugged.calls.open, "the click opened THAT object").toBe(1);
    expect(first.calls.open, "the dead object was opened again").toBe(1);
    expect(serial.calls.requestPort, "the replug needed a chooser").toBe(0);
    expect(transports, "a fresh transport per open").toHaveLength(2);
    for (const t of transports) {
      expect((t as FakeTransport).writes).toHaveLength(0);
    }

    await s.disconnect();
  });

  it("ignores an arriving port that is not a ZONA, and any arrival while a transport is live", async () => {
    // Not a ZONA: the bootloader identity, which the picker never lists and
    // which a granted-port list could still carry.
    const a = new DeviceSession();
    const serialA = fakeSerial({
      granted: [],
      pick: rejecting("NotFoundError", "No port selected by the user."),
    });
    a.start({ hasSerial: true, secure: true, serial: serialA.serial });
    await waitFor(() => a.phase === "idle", "idle");
    const stranger = notZonaPort();
    fire(serialA, "connect", stranger.port);
    expect(a.phase, "a non-ZONA arrival moved the phase").toBe("idle");
    expect(a.canForget).toBe(false);
    // Nothing was adopted, so a click goes to the chooser rather than at it.
    a.connect();
    await waitFor(() => settled(a), "the chooser");
    expect(serialA.calls.requestPort).toBe(1);
    expect(stranger.calls.open).toBe(0);

    // A live session: a second ZONA arriving is ignored, and the proof that
    // the stored reference was not replaced is that unplugging the ORIGINAL
    // still lands in S5.
    const transport = FakeTransport.fromCapture(HARDWARE, { speed: "instant" });
    const live = fakePort({ connected: true });
    const { s, serial } = await connectGranted(live, opening(transport));
    const identity = s.identity;
    const second = fakePort({ connected: true });
    fire(serial, "connect", second.port);
    expect(s.phase, "an arrival while live moved the phase").toBe("connected");
    expect(s.identity, "the published identity was touched").toBe(identity);
    expect(second.calls.open).toBe(0);

    fire(serial, "disconnect", second.port);
    expect(s.phase, "the second port's leaving is not ours").toBe("connected");
    live.setConnected(false);
    fire(serial, "disconnect", live.port);
    expect(s.phase, "the original port is still the one held").toBe(
      "unplugged-while-connected",
    );
    expect(transport.writes).toHaveLength(0);
  });

  it("the watchdog fires only on the missed disconnect, and silence alone is not a state", async () => {
    // setTimeout is the one timer the watchdog uses, so it is the one timer
    // faked; setImmediate stays real for waitFor(), Date stays real for its
    // deadline, and the clock the watchdog compares against is the injected
    // `now` below - never a faked performance.now().
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      // (a) The missed disconnect: silent past MODULE_GONE_MS AND the OS
      // reports the port detached, with no event having arrived.
      const clockA = movableClock();
      const gone = pushable([zonaHeartbeat()]);
      const portA = fakePort({ connected: true });
      const a = await connectGranted(
        portA,
        opening(gone.transport),
        clockA.now,
      );
      clockA.set(MODULE_GONE_MS + 1);
      portA.setConnected(false);
      await vi.advanceTimersByTimeAsync(MODULE_GONE_MS + 1);
      expect(a.s.phase, "the missed disconnect").toBe(
        "unplugged-while-connected",
      );
      expect(a.s.identity).toBeNull();
      expect(gone.writes).toHaveLength(0);
      await waitFor(() => portA.calls.close === 1, "the port to close");

      // (b) A heartbeat keeps arriving: the module is alive, whatever the
      // port says. Four beats over twice the window.
      const clockB = movableClock();
      const alive = pushable([zonaHeartbeat()]);
      const portB = fakePort({ connected: true });
      const b = await connectGranted(
        portB,
        opening(alive.transport),
        clockB.now,
      );
      for (let beat = 1; beat <= 6; beat++) {
        clockB.set(beat * 250);
        alive.push(zonaHeartbeat());
        portB.setConnected(false);
        await vi.advanceTimersByTimeAsync(250);
      }
      expect(b.s.phase, "a heartbeating module was torn down").toBe(
        "connected",
      );
      await b.s.disconnect();

      // (c) Silent, but the OS still reports the port attached: the session
      // stays `connected`, deliberately. A firmware crash on an attached port
      // is not a tenth state, and this assertion is what stops one being
      // reintroduced. A port with NO `connected` property at all - Chrome
      // 89-129 - is the same answer for a different reason: it cannot say.
      for (const portC of [fakePort({ connected: true }), fakePort()]) {
        const clockC = movableClock();
        const silent = pushable([zonaHeartbeat()]);
        const c = await connectGranted(
          portC,
          opening(silent.transport),
          clockC.now,
        );
        clockC.set(4 * MODULE_GONE_MS);
        await vi.advanceTimersByTimeAsync(2 * MODULE_GONE_MS + 1);
        expect(c.s.phase, "silence alone tore the session down").toBe(
          "connected",
        );
        expect(c.s.identity?.zona.moduleType).toBe("ZONA");
        expect(portC.calls.close).toBe(0);
        await c.s.disconnect();
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("the identity keeps folding: a live page number, a sorted rig, and no republish on lastSeen alone", async () => {
    const clock = movableClock();
    const bus = pushable([zonaHeartbeat()]);
    const port = fakePort({ connected: true });
    const { s } = await connectGranted(port, opening(bus.transport), clock.now);
    const atConnect = s.identity;
    expect(atConnect?.activePage).toBe(ACTIVE_PAGE);
    expect(atConnect?.otherModules).toEqual([]);

    // The visitor changes page on the module itself; the next heartbeat says
    // so, and the published identity carries it (CONN-08).
    clock.set(250);
    bus.push(zonaHeartbeat(ACTIVE_PAGE + 2));
    expect(s.identity?.activePage).toBe(ACTIVE_PAGE + 2);
    expect(s.identity, "a changed page is a new snapshot").not.toBe(atConnect);

    // Two rig modules announce themselves late and out of address order;
    // the tail comes back sorted by sx, then sy (D-08).
    clock.set(500);
    bus.push(chained(2, BU16_HWCFG));
    bus.push(chained(1, EN16_HWCFG));
    expect(
      s.identity?.otherModules.map((m) => [m.sx, m.sy, m.moduleType]),
    ).toEqual([
      [1, 0, "EN16"],
      [2, 0, "BU16"],
    ]);
    expect(s.identity?.storeAllowed, "a second module disables the store").toBe(
      false,
    );

    // The next heartbeat changes nothing but lastSeen: the SAME object stays
    // published, so nothing reading it re-runs four times a second.
    const settledIdentity = s.identity;
    clock.set(750);
    bus.push(zonaHeartbeat(ACTIVE_PAGE + 2));
    bus.push(chained(1, EN16_HWCFG));
    expect(s.identity, "lastSeen alone replaced the snapshot").toBe(
      settledIdentity,
    );
    expect(s.phase).toBe("connected");
    expect(bus.writes).toHaveLength(0);

    await s.disconnect();
  });

  it("forget() closes first, then revokes; without forget() it is a no-op and the control never renders", async () => {
    const transport = FakeTransport.fromCapture(HARDWARE, { speed: "instant" });
    const port = fakePort({ connected: true });
    const { s } = await connectGranted(port, opening(transport));
    expect(s.canForget).toBe(true);

    await s.forget();
    // The WICG forget() steps have no close step, so the order is the whole
    // point: the port is closed BEFORE the permission goes.
    expect(port.order).toEqual(["open", "close", "forget"]);
    expect(port.order.indexOf("close")).toBeLessThan(
      port.order.indexOf("forget"),
    );
    expect(transport.isOpen).toBe(false);
    expect(s.phase, "S7").toBe("forgotten");
    expect(s.identity).toBeNull();
    expect(s.canForget).toBe(false);
    expect(
      s.failureFor(CONNECT_LABEL),
      "forgotten is not a failure",
    ).toBeNull();
    expect(transport.writes).toHaveLength(0);

    // Chrome 89-102: no forget() at all. The control does not render, and
    // the action moves nothing.
    const older = fakePort({ hasForget: false });
    const b = new DeviceSession();
    b.start({
      hasSerial: true,
      secure: true,
      serial: fakeSerial({ granted: [older.port] }).serial,
    });
    await waitFor(() => b.phase === "detected", "the offer");
    expect(b.canForget, "a control that does nothing is worse than none").toBe(
      false,
    );
    await b.forget();
    expect(b.phase).toBe("detected");
    expect(older.calls.close).toBe(0);
    expect(older.calls.forget).toBe(0);
  });

  it("writes nothing across a whole visit, and cannot", async () => {
    // Half one: offer, connect, identify, unplug, replug, connect, forget -
    // against transports that record every byte. Soft, so that a planted write
    // is reported by BOTH halves in one run rather than aborting at the first.
    const transports: GridTransport[] = [];
    const first = fakePort({ connected: true });
    const { s, serial } = await connectGranted(
      first,
      openingEach(
        () => FakeTransport.fromCapture(HARDWARE, { speed: "instant" }),
        transports,
      ),
    );
    first.setConnected(false);
    fire(serial, "disconnect", first.port);
    await waitFor(() => first.calls.close === 1, "the port to close");
    const replugged = fakePort({ connected: true });
    fire(serial, "connect", replugged.port);
    s.connect();
    await waitFor(() => settled(s), "the reconnect");
    expect(s.phase).toBe("connected");
    await s.forget();
    expect(s.phase).toBe("forgotten");
    expect(replugged.order).toEqual(["open", "close", "forget"]);
    expect(transports, "the visit really ran").toHaveLength(2);
    for (const t of transports) {
      expect
        .soft((t as FakeTransport).writes, "the session wrote to the module")
        .toHaveLength(0);
    }

    // Half two: no path can. Each needle is assembled from fragments so this
    // file's own source does not contain what it forbids, and the scan runs
    // over comment-stripped source because the session's header legitimately
    // names every one of these while explaining their absence.
    const source = strip(sessionSource());
    expect(source.length, "the source was actually read").toBeGreaterThan(1000);
    for (const needle of [
      [".", "write("].join(""),
      ["Request", "Queue"].join(""),
      ["host", "Heartbeat"].join(""),
      ["send", "Config"].join(""),
      ["store", "Page"].join(""),
      ["fetch", "Config"].join(""),
      ["store", "ToFlash"].join(""),
      ["write", "Back"].join(""),
      ["set", "Interval"].join(""),
    ]) {
      expect
        .soft(source.includes(needle), `session.svelte.ts reaches ${needle}`)
        .toBe(false);
    }
  });

  // -------------------------------------------------------------------------
  // 06-09: the voice.

  it("three transitions in one window are one utterance, the last one, and a fold is none", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      // A fresh pushable per open, so the replug below gets a transport that
      // still has its first heartbeat to deliver.
      const buses: ReturnType<typeof pushable>[] = [];
      const openTransport = openingEach(() => {
        const bus = pushable([zonaHeartbeat()]);
        buses.push(bus);
        return bus.transport;
      });
      const clock = movableClock();
      const port = fakePort({ connected: true });
      const serial = fakeSerial({ granted: [port.port] });
      const s = new DeviceSession();
      const utterances = recordSpeech(s);
      s.start({
        hasSerial: true,
        secure: true,
        serial: serial.serial,
        openTransport,
        now: clock.now,
        sleep: noSleep,
      });

      // Three transitions with no timer tick between them: detected,
      // connected, unplugged. The region says nothing until the window
      // closes, and then says ONLY the last of the three.
      await waitFor(() => s.phase === "detected", "the offer");
      s.connect();
      await waitFor(() => settled(s), "identification");
      expect(s.phase).toBe("connected");
      port.setConnected(false);
      fire(serial, "disconnect", port.port);
      expect(s.phase).toBe("unplugged-while-connected");
      expect(s.speech, "spoken before the trailing window closed").toBe("");
      expect(utterances).toEqual([]);
      await vi.advanceTimersByTimeAsync(499);
      expect(utterances, "spoken inside the window").toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      expect(utterances, "one window, one utterance, the last one").toEqual([
        LIVE_UNPLUGGED,
      ]);
      expect(s.speech).toBe(LIVE_UNPLUGGED);
      await vi.advanceTimersByTimeAsync(2000);
      expect(utterances, "said again with nothing new to say").toEqual([
        LIVE_UNPLUGGED,
      ]);
      await waitFor(() => port.calls.close === 1, "the port to close");

      // The replug and the reconnect, then let the window close: detected
      // and connected coalesce to the connected sentence, built from the
      // identity as identified.
      const replugged = fakePort({ connected: true });
      fire(serial, "connect", replugged.port);
      expect(s.phase).toBe("detected");
      s.connect();
      await waitFor(() => settled(s), "the reconnect");
      expect(s.phase).toBe("connected");
      await vi.advanceTimersByTimeAsync(500);
      const connectedLine = liveConnected(FIRMWARE, ACTIVE_PAGE);
      expect(utterances).toEqual([LIVE_UNPLUGGED, connectedLine]);
      expect(buses, "two opens, two transports").toHaveLength(2);

      // The fold. A heartbeat that changes the active page DOES republish
      // the identity (CONN-08) and MUST NOT speak; one that changes only
      // lastSeen republishes nothing and speaks nothing either. The clock
      // stays under MODULE_GONE_MS of lastSeen so the watchdog re-arms.
      clock.set(250);
      buses[1].push(zonaHeartbeat(ACTIVE_PAGE + 2));
      expect(s.identity?.activePage, "the page folded").toBe(ACTIVE_PAGE + 2);
      clock.set(500);
      buses[1].push(zonaHeartbeat(ACTIVE_PAGE + 2));
      await vi.advanceTimersByTimeAsync(2000);
      expect(utterances, "a heartbeat spoke").toEqual([
        LIVE_UNPLUGGED,
        connectedLine,
      ]);
      expect(s.speech, "a heartbeat changed the region").toBe(connectedLine);
      expect(s.phase).toBe("connected");

      // And the sixth site, for the record: a disconnect that disconnected
      // something is a transition and is spoken on the same window.
      await s.disconnect();
      expect(s.phase).toBe("idle");
      await vi.advanceTimersByTimeAsync(500);
      expect(utterances).toEqual([
        LIVE_UNPLUGGED,
        connectedLine,
        LIVE_DISCONNECTED,
      ]);
      for (const bus of buses) expect(bus.writes).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("holds every announcement until released, replaces a held one, and speaks once on release", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      const bus = pushable([zonaHeartbeat()]);
      const port = fakePort({ connected: true });
      const serial = fakeSerial({ granted: [port.port] });
      const s = new DeviceSession();
      const utterances = recordSpeech(s);

      // The hold goes on BEFORE start(), as the front door's does: the splash
      // is already covering the row when the granted port is found.
      const release = s.holdSpeech();
      s.start({
        hasSerial: true,
        secure: true,
        serial: serial.serial,
        openTransport: opening(bus.transport),
        now: frozenClock,
        sleep: noSleep,
      });
      await waitFor(() => s.phase === "detected", "the offer");
      await vi.advanceTimersByTimeAsync(2000);
      expect(s.speech, "spoken while held").toBe("");
      expect(utterances).toEqual([]);

      // A second transition while still held REPLACES the first: when the
      // hold lifts only the latest state is worth speaking.
      s.connect();
      await waitFor(() => settled(s), "identification");
      expect(s.phase).toBe("connected");
      await vi.advanceTimersByTimeAsync(2000);
      expect(s.speech, "spoken while held").toBe("");
      expect(utterances).toEqual([]);

      // Release: spoken on the trailing window, not at once, exactly once,
      // and it is the connected sentence and never the detected one.
      release();
      expect(utterances, "release spoke immediately").toEqual([]);
      await vi.advanceTimersByTimeAsync(500);
      const connectedLine = liveConnected(FIRMWARE, ACTIVE_PAGE);
      expect(utterances).toEqual([connectedLine]);
      expect(utterances).not.toContain(LIVE_DETECTED);
      expect(s.speech).toBe(connectedLine);

      // A second release is a no-op, and a hold-and-release with no
      // transition in between says nothing at all.
      release();
      await vi.advanceTimersByTimeAsync(2000);
      expect(utterances).toEqual([connectedLine]);
      const again = s.holdSpeech();
      again();
      await vi.advanceTimersByTimeAsync(2000);
      expect(utterances, "an empty hold spoke").toEqual([connectedLine]);
      expect(s.speech).toBe(connectedLine);
      expect(bus.writes).toHaveLength(0);

      await s.disconnect();
    } finally {
      vi.useRealTimers();
    }
  });
});
