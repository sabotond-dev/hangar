// The device session: one object that owns the port, the identity, the phase
// and the failure, for the life of the page (D-05).
//
// WHAT THIS PLAN BUILDS, AND WHAT IT LEAVES. Capability, the granted-port
// offer, the chooser, opening and identification are here (06-03). The
// navigator-level connect and disconnect listener pair, the replug adoption,
// the liveness watchdog, forget() and the never-writes gate are plan 06-04, in
// this same file; #attachListeners below is the named, empty seat that keeps
// start()'s call order right until then.
//
// WHY THE REACTIVE FIELDS ARE SCALARS AND $state.raw ONLY. `$state` deep-
// proxies plain objects and arrays. The identify accumulator is a Map of plain
// records mutated by a callback that runs four times a second for as long as
// the module is connected, and a proxy in that path is pure cost with nothing
// reading it. So the port, the transport, the scanner and the accumulator are
// plain private fields; only scalars and whole-value snapshots cross into a
// rune, and a snapshot is replaced, never mutated (the house rule of
// src/lib/sim/host.ts and src/lib/tune/model.ts).
//
// WHY THERE ARE EXACTLY FOUR STATIC `from` SPECIFIERS, AND WHICH FOUR. A header
// component renders this session's phase on the first paint of `/`, and Phase
// 4's chunk guard (src/lib/config-shape.spec.ts test 13, widened in plan 06-05
// so this rule is enforced rather than remembered) matches specifier TEXT. So
// everything this file names statically has to be free of the protocol
// package, and it is:
//
//   ./session-copy           zero imports. The copy, the phase table and the
//                            capability rule.
//   $lib/protocol/usb        zero imports. ZONA_USB, the chooser's filter.
//   $lib/transport/ports     imports only $lib/protocol/usb. The granted-port
//                            offer and the attached check.
//   $lib/transport/transport ZERO imports - verified by reading it. It
//                            declares OpenFailure, FailureCopy,
//                            classifyOpenError and failureCopy, and the
//                            DOMException and SerialPort it names are
//                            globals, not specifiers. That fourth one is what
//                            makes failureFor() synchronous for all nine named
//                            states: the taxonomy and its sentences are in
//                            hand before anything has been fetched, so
//                            `unsupported` and `insecure` are decided and
//                            rendered in the same frame on a browser that
//                            could never use the chunk. The alternatives were
//                            duplicating UNSUPPORTED_DETAIL into
//                            session-copy.ts or downloading 131,101 bytes to
//                            render one sentence, and neither is needed once
//                            the taxonomy module is known to be import-free.
//
// Every other reference to $lib/protocol, $lib/transport (the barrel) or
// $lib/device/try-on is a `typeof import(...)` type alias - erased, and
// invisible to a specifier scan, exactly as TryOnDevice.svelte does it - or an
// `await import(...)` inside the open path, which is the only path that needs
// the compiler's chunk and the only place it is fetched.
//
// WHY requestPort() IS THE FIRST STATEMENT OF connect(), AND WHY IT IS INSIDE
// A try. Transient user activation EXPIRES (about 4.9 s in current engines)
// rather than being consumed, so anything awaited in front of the chooser call
// can outlast it and make the picker reject for a reason that reads to a
// visitor as a permissions bug. And a lost activation is THROWN by the
// browser, synchronously (serial.cc:291-293), not rejected - so a `.catch()`
// on the stored promise would never see it, and only a try around the call
// itself does. The heavy modules are awaited AFTER the chooser has been asked
// for, in every code path.
//
// WHY start() NEVER OPENS A PORT. D-06 and SAFE-01's spirit. An open port is
// exclusive: a page that opened one on load would take the visitor's ZONA away
// from Grid Editor with no click. start() asks getPorts() - no gesture, no
// prompt - adopts a granted, attached ZONA if there is one, and publishes
// `detected` so the header can OFFER a connection. One click opens it.
//
// THE CLASS IS EXPORTED BESIDE THE SINGLETON, AND THE TWO HAVE DIFFERENT
// READERS. `session` is for components: one instance per page load is D-05,
// and +layout.svelte and every device component read that one. Every node
// test constructs its own `new DeviceSession()` and never touches the
// singleton, so no test can leak a phase, a port or a timer into the next and
// session.spec.ts needs no reset hook. For the same reason every private
// field the machine holds - #busy and #started included - is an INSTANCE
// field: a module-scope flag would be shared by every instance and would make
// the second test in a file start half-initialised.
//
// NEVER WRITES. No RequestQueue, no host heartbeat, no config write, no page
// store, and no call to any transport's write. Plan 06-04 asserts that as a
// property of this file's source.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  FAILURE_COPY_STATES,
  type SessionBlock,
  type SessionPhase,
  capabilityOf,
  notZonaBlock,
  silentBlock,
  unpluggedWhileConnectedBlock,
} from "./session-copy";
import { ZONA_USB } from "$lib/protocol/usb";
import { grantedZonaPorts, portIsAttached } from "$lib/transport/ports";
import {
  type GridTransport,
  type OpenFailure,
  classifyOpenError,
  failureCopy,
} from "$lib/transport/transport";

// Type-only references. Erased at compile time, so none of these is a
// specifier the chunk guard can see, and none costs a byte on the load path.
type Protocol = typeof import("$lib/protocol");
type Transport = typeof import("$lib/transport");
type Device = typeof import("$lib/device/try-on");
type Identity = import("$lib/transport").Identity;

/** The three heavy modules, resolved together on the open path and kept. */
interface HeavyModules {
  P: Protocol;
  T: Transport;
  D: Device;
}

/**
 * The part of `navigator.serial` this session uses, as an interface so a node
 * test can hand in a fake. The event methods exist for plan 06-04's listener
 * pair; nothing in this plan calls them.
 */
export interface SerialLike {
  requestPort(options?: {
    filters?: { usbVendorId: number; usbProductId: number }[];
  }): Promise<SerialPort>;
  getPorts(): Promise<SerialPort[]>;
  addEventListener(type: string, listener: (ev: Event) => void): void;
  removeEventListener(type: string, listener: (ev: Event) => void): void;
}

/**
 * The session's environment. `start()` fills every unset field from the
 * browser's globals, so a component passes nothing and a test passes what it
 * wants to control.
 */
export interface SessionEnv {
  hasSerial: boolean;
  secure: boolean;
  serial: SerialLike;
  /** Opens an adopted port and returns a transport over it. Default: open() + WebSerialTransport. */
  openTransport?: (port: SerialPort) => Promise<GridTransport>;
  /** The clock, the poll period and the sleep identifyOnly already takes, passed through. */
  now?: () => number;
  pollMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * The OpenFailure key each failureCopy phase renders when the session was
 * put into that phase without a classified error - the two capability states
 * always, and any phase a test assigns directly.
 */
const KEY_OF: Record<(typeof FAILURE_COPY_STATES)[number], OpenFailure> = {
  unsupported: "no-web-serial",
  insecure: "insecure-context",
  cancelled: "cancelled",
  "port-busy": "port-busy",
  "unplugged-at-open": "unplugged",
  unknown: "unknown",
};

const isFailureCopyPhase = (
  phase: SessionPhase,
): phase is (typeof FAILURE_COPY_STATES)[number] =>
  (FAILURE_COPY_STATES as readonly SessionPhase[]).includes(phase);

/**
 * The memoised module promise, and the ONE thing it covers: the open path.
 * $lib/protocol for the open parameters and the identify window,
 * $lib/transport for WebSerialTransport, $lib/device/try-on for identifyOnly -
 * all three genuinely heavy, all three awaited only inside #openAdopted, which
 * is only reached after the chooser has been asked for. Nothing about a
 * failure awaits this.
 *
 * Module scope on purpose, and it is the one thing here that is: ES modules
 * are singletons whatever instance asks for them, and this promise carries no
 * session state, so sharing it between instances is correct rather than a
 * leak.
 *
 * The three awaits are sequential rather than a Promise.all. All three share
 * the protocol chunk, which the first await fetches, so the second and third
 * are small; and nothing here is racing an activation window - the chooser has
 * already closed by the time this runs.
 */
let heavy: Promise<HeavyModules> | undefined;
async function loadHeavy(): Promise<HeavyModules> {
  const P = await import("$lib/protocol");
  const T = await import("$lib/transport");
  const D = await import("$lib/device/try-on");
  return { P, T, D };
}
const heavyModules = (): Promise<HeavyModules> => (heavy ??= loadHeavy());

/** The default transport factory: the real open, then the real transport. */
async function openWithWebSerial(port: SerialPort): Promise<GridTransport> {
  const { P, T } = await heavyModules();
  // MDN's default read buffer is 255 bytes, and a factory Setup config comes
  // back as a 690-byte REPORT; without this it arrives as three chunks.
  await port.open({ baudRate: P.BAUD_RATE, bufferSize: P.READ_BUFFER_SIZE });
  return new T.WebSerialTransport(port);
}

export class DeviceSession {
  // --- reactive: scalars and whole-value snapshots only ---------------------

  /** `starting` is slot state S1, the state of every prerendered page. */
  phase = $state<SessionPhase>("starting");
  identity = $state.raw<Identity | null>(null);
  /** The transport's key, so failureFor() can render it with either surface's label. */
  failureKind = $state.raw<OpenFailure | null>(null);
  failureRaw = $state.raw<string | undefined>(undefined);
  /** The one behavioural modifier on `cancelled` (Y-06). */
  permissionDeclined = $state(false);
  /** The module named by a refusal, for notZonaBlock. */
  refusedModule = $state.raw<string | undefined>(undefined);
  canForget = $state(false);

  // --- NOT reactive: host objects, guards, and the injected environment ----

  #port: SerialPort | undefined;
  #transport: GridTransport | undefined;
  #serial: SerialLike | undefined;
  #openTransport: (port: SerialPort) => Promise<GridTransport> =
    openWithWebSerial;
  #now: () => number = () => performance.now();
  #pollMs: number | undefined;
  #sleep: ((ms: number) => Promise<void>) | undefined;
  /**
   * The identify window in seconds, for silentBlock. Read from the pinned
   * package on the open path - the only path from which `silent` can be
   * reached - so the sentence and the wait it describes come from the same
   * constant, and never through a fifth static specifier. Plan 06-04's
   * watchdog takes MODULE_GONE_MS from the same awaited module the same way.
   */
  #windowSeconds = 0;
  /** The in-flight guard. Cleared on every exit path, in a finally. */
  #busy = false;
  /** start() runs once per instance; a second call would attach listeners twice. */
  #started = false;

  // --- start: synchronous, and it opens nothing -----------------------------

  /**
   * Called once, from the root layout's onMount, and never at module scope:
   * the prerenderer evaluates module scope and there is no navigator there.
   *
   * SYNCHRONOUS. The capability is decided in the calling frame, so the two
   * states that render no header note are known before the first hydrated
   * paint and nothing is fetched to render their sentence. The granted-port
   * offer is the only thing that runs afterwards, and it opens nothing.
   */
  start(env: Partial<SessionEnv> = {}): void {
    if (this.#started) return;
    this.#started = true;

    const capability = capabilityOf({
      hasSerial:
        env.hasSerial ??
        (typeof navigator !== "undefined" && "serial" in navigator),
      secure:
        env.secure ??
        (typeof isSecureContext !== "undefined" && isSecureContext),
    });
    if (capability !== "ok") {
      this.failureKind =
        capability === "unsupported" ? "no-web-serial" : "insecure-context";
      // "unsupported" | "insecure", decided in this frame. No listeners, no
      // getPorts, NOTHING FETCHED - not even for the copy, which failureCopy
      // already has statically.
      this.phase = capability;
      return;
    }

    this.#serial = env.serial ?? navigator.serial;
    if (env.openTransport) this.#openTransport = env.openTransport;
    if (env.now) this.#now = env.now;
    this.#pollMs = env.pollMs;
    this.#sleep = env.sleep;

    this.#attachListeners();
    void this.#offerGranted();
  }

  /**
   * The navigator-level connect and disconnect listener pair, for the life of
   * the page (D-07). Plan 06-04 fills this in; it is named and called here so
   * start()'s order - capability, listeners, then the offer - is already right.
   */
  #attachListeners(): void {
    // 06-04.
  }

  /**
   * CONN-06's silent reconnect: getPorts(), no gesture, never open().
   *
   * The attached filter is `!== false`, not `=== true`: Chrome 89-129 has no
   * `connected` at all, and `undefined` must mean "keep it". An empty list
   * means "not plugged in", never "no grant" - getPorts() only returns ports
   * that are both granted AND physically present (Pitfall 9) - so `idle`
   * publishes nothing about permission.
   */
  async #offerGranted(): Promise<void> {
    const serial = this.#serial;
    if (!serial) return;
    const granted = await grantedZonaPorts(serial);
    const attached = granted.filter((p) => portIsAttached(p) !== false);
    if (attached.length > 0) {
      this.#adopt(attached[0]);
      this.phase = "detected";
    } else {
      this.phase = "idle";
    }
  }

  /** Hold a permitted port without opening it. Replaces any earlier reference. */
  #adopt(port: SerialPort): void {
    this.#port = port;
    // @types declares forget() non-optional; the `in` test is the only real
    // guard (Chrome 103+, Firefox 151+). A control that does nothing is worse
    // than none, so this is what decides whether it renders.
    this.canForget = "forget" in port;
  }

  // --- connect: one action, two call sites, one activation window ----------

  /**
   * MUST be called synchronously from a click handler. See the header for why
   * requestPort() is the first statement and why it sits inside a try.
   *
   * Two controls are bound to this one action (D-02), and #busy is what makes
   * a double click - or a click on each control inside the same second - a
   * no-op rather than a racing open() and an InvalidStateError.
   */
  connect(): void {
    if (this.#busy) return;
    const serial = this.#serial;
    if (!serial) return;
    this.#busy = true;

    // The adopted-port path takes no chooser at all (D-06) and therefore
    // needs no activation - but it is still behind a click.
    if (this.#port && !this.#transport) {
      void this.#openAdopted();
      return;
    }

    let picking: Promise<SerialPort>;
    try {
      picking = serial.requestPort({ filters: [ZONA_USB] });
    } catch (err) {
      this.#refuse(err);
      this.#busy = false;
      return;
    }
    this.#clearFailure();
    this.phase = "choosing";
    void this.#afterPick(picking);
  }

  async #afterPick(picking: Promise<SerialPort>): Promise<void> {
    let picked: SerialPort;
    try {
      picked = await picking;
    } catch (err) {
      // A closed chooser is a NotFoundError, not a fault, and the copy says so.
      this.#refuse(err);
      this.#busy = false;
      return;
    }
    this.#adopt(picked);
    await this.#openAdopted();
  }

  /**
   * Open the adopted port, build the transport, listen until the module names
   * itself. `identified` becomes `connected`; `not-zona` and `silent` set
   * their phases AND close the port, because both recovery lists tell the
   * visitor to try again and a port this page is still holding would make
   * that impossible. #busy is cleared in the finally on every path.
   */
  async #openAdopted(): Promise<void> {
    const port = this.#port;
    try {
      if (!port) return;
      this.#clearFailure();
      this.phase = "opening";

      // The only fetch of the compiler's chunk on this site's device path,
      // and it happens here: after the chooser, before the open.
      const modules = await heavyModules();
      this.#windowSeconds = modules.P.IDENTIFY_WINDOW_MS / 1000;

      let transport: GridTransport;
      try {
        transport = await this.#openTransport(port);
      } catch (err) {
        this.#refuse(err, port);
        return;
      }
      this.#transport = transport;
      transport.onClose(() => this.#onTransportClosed(transport));

      this.phase = "identifying";
      const outcome = await modules.D.identifyOnly(transport, {
        now: this.#now,
        pollMs: this.#pollMs,
        sleep: this.#sleep,
      });
      if (outcome.kind === "identified") {
        this.identity = outcome.identity;
        this.phase = "connected";
        return;
      }
      if (outcome.kind === "not-zona") {
        this.refusedModule = outcome.moduleType;
        this.phase = "not-zona";
      } else {
        this.phase = "silent";
      }
      await this.#teardown();
    } finally {
      this.#busy = false;
    }
  }

  /**
   * The transport closed under us - a read error, or the transport's own
   * port-level disconnect. 06-04's navigator-level listener is the primary
   * path to `unplugged-while-connected`; this is the net under it, so a dead
   * port is never still published as `connected`.
   */
  #onTransportClosed(transport: GridTransport): void {
    if (this.#transport !== transport) return; // a teardown this session started
    this.#transport = undefined;
    this.identity = null;
    if (this.phase === "connected") this.phase = "unplugged-while-connected";
  }

  // --- the failure, named synchronously ------------------------------------

  /**
   * Classify what requestPort() or open() threw and put the session in the
   * named state. classifyOpenError is a static import, so nothing is awaited
   * before a failure has a name.
   *
   * One branch sits before the classifier: a NotAllowedError is a declined
   * permission prompt, which the classifier has no row for and which is a
   * closed chooser by another route - so it is `cancelled`, with the one
   * behavioural modifier set (Y-06).
   */
  #refuse(err: unknown, port?: SerialPort): void {
    const raw = err instanceof Error ? err.message : String(err);
    if (err instanceof DOMException && err.name === "NotAllowedError") {
      this.failureKind = "cancelled";
      this.failureRaw = raw;
      this.permissionDeclined = true;
      this.phase = "cancelled";
      return;
    }
    const kind = classifyOpenError(err, port);
    this.failureKind = kind;
    this.failureRaw = raw;
    switch (kind) {
      case "cancelled":
        this.phase = "cancelled";
        return;
      case "port-busy":
        this.phase = "port-busy";
        return;
      case "unplugged":
        // The S6 open failure. The picked object is dead, so the next click
        // goes back through the chooser rather than at a port that is gone.
        this.#port = undefined;
        this.canForget = false;
        this.phase = "unplugged-at-open";
        return;
      default:
        // `already-open` and `unknown` both render through the unknown row;
        // the key is kept so the block reads the already-connecting sentence.
        this.phase = "unknown";
        return;
    }
  }

  #clearFailure(): void {
    this.failureKind = null;
    this.failureRaw = undefined;
    this.permissionDeclined = false;
    this.refusedModule = undefined;
  }

  /**
   * The one block, for either surface. `label` is the control on the surface
   * rendering it, so no step names a button the visitor cannot see.
   *
   * Synchronous for all nine named states, and it never returns null because
   * something has not loaded yet: failureCopy is a static import from a
   * module with no imports of its own, and the three authored blocks come
   * from session-copy, which has none either. Any phase that is not a named
   * state is null.
   */
  failureFor(label: string): SessionBlock | null {
    const phase = this.phase;
    if (isFailureCopyPhase(phase)) {
      return failureCopy(
        this.failureKind ?? KEY_OF[phase],
        this.failureRaw,
        label,
      );
    }
    switch (phase) {
      case "not-zona":
        return notZonaBlock(this.refusedModule, label);
      case "silent":
        return silentBlock(this.#windowSeconds, label);
      case "unplugged-while-connected":
        return unpluggedWhileConnectedBlock();
      default:
        return null;
    }
  }

  // --- disconnect ----------------------------------------------------------

  /** Tear down, clear the identity, return to `idle`. The permission is untouched. */
  async disconnect(): Promise<void> {
    await this.#teardown();
    this.identity = null;
    this.#clearFailure();
    this.phase = "idle";
  }

  /**
   * Close whatever is open. Clears the transport and never the port: the
   * port object stays adopted so forget() (06-04) can still revoke it.
   *
   * WebSerialTransport.close() closes the port it wraps; an injected transport
   * may not own the port at all. `readable` is null on a closed port, so the
   * second close only ever runs on a port something else left open.
   */
  async #teardown(): Promise<void> {
    const transport = this.#transport;
    this.#transport = undefined;
    if (transport) await transport.close().catch(() => undefined);
    const port = this.#port;
    if (port && port.readable !== null) {
      await port.close().catch(() => undefined);
    }
  }
}

/** The one instance components read (D-05). Tests never touch it. */
export const session = new DeviceSession();
