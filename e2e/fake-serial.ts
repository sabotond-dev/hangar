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
}

declare global {
  interface Window {
    __hangarSerial: HangarSerial;
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
  let nextRequest: NextRequest | undefined;

  class FakePort extends EventTarget {
    info: { usbVendorId: number; usbProductId: number };
    connected = true;
    readable: ReadableStream<Uint8Array> | null = null;
    writable: WritableStream<Uint8Array> | null = null;
    openError: Failure | undefined;
    wasForgotten = false;
    private controller: ReadableStreamDefaultController<Uint8Array> | undefined;

    constructor(vid: number, pid: number) {
      super();
      this.info = { usbVendorId: vid, usbProductId: pid };
    }

    getInfo() {
      return this.info;
    }

    async open(): Promise<void> {
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
        write: () => {
          writes += 1;
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
    unplug: (i) => {
      const port = ports[i];
      port.detach();
      fire("disconnect", port);
    },
    replug: (vid = ZONA_VID, pid = ZONA_PID) => {
      const index = mint(vid, pid);
      fire("connect", ports[index]);
      return index;
    },
    feed: (i, bytes) => ports[i].feed(bytes),
    forgotten: (i) => ports[i]?.wasForgotten ?? false,
    writes: () => writes,
  };
};
