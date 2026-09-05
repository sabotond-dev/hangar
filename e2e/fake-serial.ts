// A scripted `navigator.serial`, installed before any page script runs (D-14).
//
// A FIXTURE MODULE, NOT A TEST FILE. playwright.config.ts collects
// `**/*.e2e.ts`; this file matches nothing and contributes no title, and the
// count gate is what proves that. It exports one function for
// `context.addInitScript` and the type of the control surface that function
// leaves on `window.__hangarSerial` for a test to drive from `page.evaluate`.
//
// WHY THIS WORKS AT ALL. Web Serial has no CDP domain and no fake-device
// hook, but `serial` is a CONFIGURABLE ACCESSOR on `Navigator.prototype`,
// which is exactly why the shipped degrade tests can `delete` it from the
// prototype (e2e/skeleton.e2e.ts). What deletes can also be defined: the
// same slot takes a getter returning this object, and on an engine that has
// no serial at all the slot is simply absent and defineProperty creates it.
// So every state the session has can be walked on BOTH Playwright projects
// with no hardware and no human - including the engine that can never
// install.
//
// THE BUBBLE DOES NOT COME FOR FREE. Real `connect` and `disconnect` events
// are fired AT THE PORT with bubbles:true and reach `navigator.serial`
// through the event PATH. A plain EventTarget has no path, so this shim
// dispatches at BOTH the fake port and the fake serial object, and the second
// dispatch carries an own `target` property reporting the port, because a
// listener on `navigator.serial` reads `ev.target` to learn which port
// arrived (src/lib/device/session.svelte.ts, #onSerialConnect). Getting this
// wrong would make every navigator-level listener test pass against a page
// that fails in a real browser. Plan 06-06 ran a throwaway self-check for
// exactly that property before any session test existed, and its result is
// recorded in 06-06-SUMMARY.md.
//
// WHAT THIS SHIM CAN PROVE, AND WHAT IT CANNOT. It is MODELLED ON A SOURCE
// READING of the browser (06-RESEARCH.md, The Replug Identity Trap), so it
// can only show that HANGAR is consistent with that reading. The replug
// behaviour in particular - `replug()` mints a NEW port object and fires
// `connect` at it, never at the object the session already holds - is
// Chromium's as read from serial_service.cc and serial.cc, and this shim
// reproducing it is not evidence that the browser does it. That circle is
// closed by a human with a module on the desk: docs/SESSION-RUNBOOK.md row B,
// the unplug-and-replug row, written by plan 06-14. The same limit holds for
// the busy port (the shim raises the NetworkError; it cannot show that Grid
// Editor is what raises it) and for the cancelled chooser (the shim rejects
// with NotFoundError; only a real empty picker shows that the browser does).
// Two things it proves completely: that the session writes zero bytes across
// any walk a test can script, and the two capability branches.
//
// NEVER WRITES. There is no device here to write to, and the `writes()`
// counter exists so a test can assert the number is zero after any walk.
// `feed()` is the ONLY way bytes enter the page, and the bytes are read in
// Node from the committed hardware capture by the test that pushes them
// (plan 06-07) - never inlined here, so the one capture stays the source of
// truth and this shim stays small.
//
// SINCE PHASE 7 (plan 07-08) THE SHIM CAN ANSWER, AND THE ANSWER IS NOT HERE.
// An install needs an acknowledgement echoing the request id firmware reads
// off the wire, a serial report and a re-fetch of what was stored, and a
// second scripted ZONA written into this init script would drift from the
// one the node suite trusts. So the fake port's write() does exactly one more
// thing: when a test has exposed `window.__hangarZona` through
// page.exposeFunction (e2e/fake-zona.ts, over the REAL zonaResponder of
// src/lib/transport/fixtures/synthetic.ts), it hands the chunk over as hex,
// AWAITS the reply, and pushes every frame that comes back into its own
// readable stream. That await is load-bearing and is what makes this fake
// differ from FakeTransport in one respect fake-zona.ts's header spells out:
// a held acknowledgement here stalls the page's write() itself. The replies
// never include a heartbeat; `beat()` exists so the test paces those, the way
// the module's own 4 Hz does. Nothing about `feed()` changed, and no capture
// byte is inlined.
//
// The init function below is SELF-CONTAINED. Playwright serialises it with
// toString() and evaluates it in the page, so nothing in it may close over
// this module's scope; the interface above it is a type, erased before that
// happens.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The control surface, as a test sees it through `page.evaluate`. */
export interface HangarSerial {
  /** A port this origin has already been granted and that is attached. Returns its index. */
  grant(vid?: number, pid?: number): number;
  /** The next requestPort() resolves with port `i`. */
  pick(i: number): void;
  /** The next requestPort() rejects. Default: the closed, empty or blocked chooser. */
  reject(name?: string, message?: string): void;
  /** The next requestPort() THROWS synchronously - the lost-activation failure. */
  throwOnRequest(name: string, message: string): void;
  /** open() on port `i` throws NetworkError, as it does while Grid Editor holds the port. */
  busy(i: number): void;
  /** open() on port `i` throws that named DOMException. */
  openFails(i: number, name: string, message: string): void;
  /** Fires `disconnect` for port `i` and sets its `connected` false. */
  unplug(i: number): void;
  /** Mints a NEW port object and fires `connect` at it. Returns its index. */
  replug(vid?: number, pid?: number): number;
  /** Pushes rx bytes into port `i`'s readable stream. */
  feed(i: number, bytes: number[]): void;
  /** Whether forget() was called on port `i`. */
  forgotten(i: number): boolean;
  /** The number of chunks ever written to any fake port. */
  writes(): number;
  /**
   * How many times requestPort() has been called, a throw included. The
   * number that makes "one click, no picker" falsifiable (plan 06-07).
   */
  requests(): number;
  /**
   * How many times open() was called on port `i`, a refused open included.
   * The number that makes "the offer never opens the port" falsifiable, and
   * after a replug it is what says WHICH object the click opened.
   */
  openCount(i: number): number;
  /**
   * Port `i` fires `disconnect` and closes its streams the moment its `n`th
   * write arrives - the install store's `lost` state. The write that caused
   * it is recorded in writesOf() and is never handed to the responder: the
   * cable came out as the bytes left, so no module heard them (plan 07-08).
   */
  unplugAfterWrites(i: number, n: number): void;
  /**
   * Push one frame (hex, terminated) into port `i` - a heartbeat. The
   * responder's replies never include one, so the test paces them.
   */
  beat(i: number, hex: string): void;
  /** The hex of every chunk ever written to any fake port, in order. */
  writesOf(): string[];
}

declare global {
  interface Window {
    __hangarSerial: HangarSerial;
    /**
     * The Node-side ZONA, when a test exposed one (e2e/fake-zona.ts). Takes
     * one written chunk as hex; resolves with every reply frame as hex, each
     * carrying its terminator. Absent on every Phase 6 walk, where the shim
     * answers nothing.
     */
    __hangarZona?: (hex: string) => Promise<string[]>;
  }
}

/**
 * Pass to `context.addInitScript` BEFORE the first `page.goto`, so the getter
 * is on the prototype before any page script reads `navigator.serial`.
 */
export const FAKE_SERIAL = (): void => {
  // The ZONA's application identity - the pair the session's chooser filter
  // names - spelled here rather than imported, because this function is
  // serialised and may close over nothing.
  const ZONA_VID = 0x303a;
  const ZONA_PID = 0x8123;

  interface Failure {
    name: string;
    message: string;
  }
  type NextRequest =
    | { kind: "pick"; index: number }
    | { kind: "reject"; name: string; message: string }
    | { kind: "throw"; name: string; message: string };

  let writes = 0;
  let requests = 0;
  let nextRequest: NextRequest | undefined;
  /** Every chunk ever written, as hex, in order - the Node side counts by class from it. */
  const writeLog: string[] = [];

  const toHex = (bytes: Uint8Array): string =>
    Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const fromHex = (hex: string): number[] => {
    const out: number[] = [];
    for (let i = 0; i + 1 < hex.length; i += 2) {
      out.push(parseInt(hex.slice(i, i + 2), 16));
    }
    return out;
  };

  class FakePort extends EventTarget {
    info: { usbVendorId: number; usbProductId: number };
    connected = true;
    readable: ReadableStream<Uint8Array> | null = null;
    writable: WritableStream<Uint8Array> | null = null;
    openError: Failure | undefined;
    wasForgotten = false;
    /** Every call, counted before any outcome is decided. */
    opens = 0;
    /** This port's own write count, for unplugAfterWrites. */
    writesSeen = 0;
    /** The write count at which this port unplugs itself, or undefined. */
    unplugAt: number | undefined;
    private controller: ReadableStreamDefaultController<Uint8Array> | undefined;

    constructor(vid: number, pid: number) {
      super();
      this.info = { usbVendorId: vid, usbProductId: pid };
    }

    getInfo() {
      return this.info;
    }

    async open(): Promise<void> {
      this.opens += 1;
      if (this.openError) {
        throw new DOMException(this.openError.message, this.openError.name);
      }
      if (this.readable) {
        // The browser's own wording for a racing open (serial_port.cc).
        throw new DOMException(
          "The port is already open.",
          "InvalidStateError",
        );
      }
      this.readable = new ReadableStream<Uint8Array>({
        start: (controller) => {
          this.controller = controller;
        },
      });
      this.writable = new WritableStream<Uint8Array>({
        write: async (chunk) => {
          writes += 1;
          this.writesSeen += 1;
          writeLog.push(toHex(chunk));
          if (this.unplugAt !== undefined && this.writesSeen >= this.unplugAt) {
            this.unplugAt = undefined;
            // The bytes left the host and the cable came out before any
            // answer. The disconnect fires on the NEXT macrotask so the
            // page's write() resolves first, as a real port reports an
            // unplug after the OS took the bytes: a write that threw would
            // reach the request queue as a plain Error and be classified as
            // a timeout, and the store's `lost` - which needs the queue's
            // own AbortedError from the session's "closed" - could never be
            // reached from here.
            setTimeout(() => unplugPort(this), 0);
            return;
          }
          const respond = window.__hangarZona;
          if (!respond) return;
          // Node answers through page.exposeFunction. Each reply is one
          // frame WITH its terminator, pushed as its own rx chunk.
          const replies = await respond(toHex(chunk));
          for (const hex of replies) this.feed(fromHex(hex));
        },
      });
    }

    /** End the byte stream, as an unplug does; a pending read resolves done. */
    private endStream(): void {
      try {
        this.controller?.close();
      } catch {
        // Already closed or errored; nothing to end.
      }
      this.controller = undefined;
    }

    async close(): Promise<void> {
      this.endStream();
      this.readable = null;
      this.writable = null;
    }

    async forget(): Promise<void> {
      // The WICG steps remove the port from the permitted list and resolve.
      // There is NO close step, deliberately reproduced: a session that
      // forgets before it closes is the bug the session's own order avoids.
      // The port stays in `ports` under its index - getPorts() filters it
      // out - so every index a test holds stays valid after a forget.
      this.wasForgotten = true;
    }

    feed(bytes: number[]): void {
      this.controller?.enqueue(Uint8Array.from(bytes));
    }

    detach(): void {
      this.connected = false;
      this.endStream();
    }
  }

  const ports: FakePort[] = [];

  class FakeSerial extends EventTarget {
    /** Granted AND attached, which is what the real list means (Pitfall 9). */
    getPorts(): Promise<SerialPort[]> {
      return Promise.resolve(
        ports.filter(
          (p) => p.connected && !p.wasForgotten,
        ) as unknown as SerialPort[],
      );
    }

    /**
     * NOT async. The lost-activation failure is THROWN by the browser,
     * synchronously, and only a try around the call itself sees it - so a
     * scripted throw has to leave this function the same way.
     */
    requestPort(): Promise<SerialPort> {
      requests += 1;
      const next = nextRequest;
      nextRequest = undefined;
      if (next?.kind === "throw") {
        throw new DOMException(next.message, next.name);
      }
      if (next?.kind === "pick") {
        return Promise.resolve(ports[next.index] as unknown as SerialPort);
      }
      return Promise.reject(
        new DOMException(
          next?.message ?? "No port selected by the user.",
          next?.name ?? "NotFoundError",
        ),
      );
    }
  }

  const serial = new FakeSerial();

  /**
   * BOTH targets, port first, mirroring a real bubble. The second event is a
   * real Event (dispatchEvent brand-checks its argument, so a Proxy would be
   * refused) with an own `target` that shadows the prototype getter.
   */
  const fire = (type: "connect" | "disconnect", port: FakePort): void => {
    port.dispatchEvent(new Event(type, { bubbles: true }));
    const forwarded = new Event(type, { bubbles: true });
    Object.defineProperty(forwarded, "target", {
      configurable: true,
      get: () => port,
    });
    serial.dispatchEvent(forwarded);
  };

  const mint = (vid: number, pid: number): number => {
    ports.push(new FakePort(vid, pid));
    return ports.length - 1;
  };

  /** The one unplug: the streams end, `connected` drops, both targets hear it. */
  const unplugPort = (port: FakePort): void => {
    port.detach();
    fire("disconnect", port);
  };

  Object.defineProperty(Navigator.prototype, "serial", {
    configurable: true,
    get: () => serial,
  });

  window.__hangarSerial = {
    grant: (vid = ZONA_VID, pid = ZONA_PID) => mint(vid, pid),
    pick: (i) => {
      nextRequest = { kind: "pick", index: i };
    },
    reject: (
      name = "NotFoundError",
      message = "No port selected by the user.",
    ) => {
      nextRequest = { kind: "reject", name, message };
    },
    throwOnRequest: (name, message) => {
      nextRequest = { kind: "throw", name, message };
    },
    busy: (i) => {
      ports[i].openError = {
        name: "NetworkError",
        message: "Failed to open serial port.",
      };
    },
    openFails: (i, name, message) => {
      ports[i].openError = { name, message };
    },
    unplug: (i) => unplugPort(ports[i]),
    replug: (vid = ZONA_VID, pid = ZONA_PID) => {
      const index = mint(vid, pid);
      fire("connect", ports[index]);
      return index;
    },
    feed: (i, bytes) => ports[i].feed(bytes),
    forgotten: (i) => ports[i]?.wasForgotten ?? false,
    writes: () => writes,
    requests: () => requests,
    openCount: (i) => ports[i]?.opens ?? 0,
    unplugAfterWrites: (i, n) => {
      ports[i].unplugAt = n;
    },
    beat: (i, hex) => ports[i].feed(fromHex(hex)),
    writesOf: () => [...writeLog],
  };
};
