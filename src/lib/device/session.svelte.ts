// The device session: one object that owns the port, the identity, the phase
// and the failure for the life of the page (D-05) - the half the visitor
// drives (capability, the granted-port offer, the chooser, opening,
// identification; 06-03) and the half the hardware drives (the navigator-level
// listener pair, replug adoption, the continuous fold, the liveness watchdog,
// forget(); 06-04). It NEVER WRITES: every write lives in install.svelte.ts,
// which borrows the `transport` view, onClass(), onConnection(), announce()
// and writeLock (07-04, 07-CONTEXT D-16). Components read the singleton
// `session`; every node test constructs its own `new DeviceSession()`.
//
// Decided at 06-04 (06-CONTEXT D-05, D-07); see .planning/phases/06-device-session/06-04-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
//
// RULES A SPEC ENFORCES, one line each:
//   four light static specifiers and no more (config-shape.spec.ts test 13;
//     install.spec.ts "the file's shape"): ./session-copy, $lib/protocol/usb,
//     $lib/transport/ports, $lib/transport/transport - none reaches the
//     protocol package; protocol, transport and try-on arrive by await import()
//   eleven write-shaped needles absent from the comment-stripped source
//     (session.spec.ts "writes nothing across a whole visit, and cannot"); the
//     one place this file names `write` is the view's BINDING of it
//   requestPort() is the first statement of connect(), inside a try: transient
//     activation expires, and a lost one is THROWN synchronously (serial.cc:291)
//   start() never opens a port (D-06, SAFE-01): getPorts(), adopt, `detected`
//   reactive fields are scalars and $state.raw snapshots, replaced never mutated
//   the listener pair is attached at navigator.serial, not the port (06-RESEARCH)
//   #say has six session sites plus announce(); the fold never speaks (06-09, D-17)
import {
  CONNECT_LABEL,
  FAILURE_COPY_STATES,
  LIVE_DETECTED,
  LIVE_DISCONNECTED,
  LIVE_FORGOTTEN,
  LIVE_UNPLUGGED,
  type SessionBlock,
  type SessionPhase,
  capabilityOf,
  liveConnected,
  notZonaBlock,
  silentBlock,
  unpluggedWhileConnectedBlock,
} from "./session-copy";
import { ZONA_USB } from "$lib/protocol/usb";
import {
  grantedZonaPorts,
  isZonaPort,
  portIsAttached,
} from "$lib/transport/ports";
import {
  type GridTransport,
  type OpenFailure,
  classifyOpenError,
  failureCopy,
} from "$lib/transport/transport";

// Type-only references: erased, so none is a specifier the chunk guard sees.
type Protocol = typeof import("$lib/protocol");
type Transport = typeof import("$lib/transport");
type Device = typeof import("$lib/device/try-on");
type Identity = import("$lib/transport").Identity;
type IdentifyState = import("$lib/transport").IdentifyState;
type ModuleSeen = import("$lib/transport").ModuleSeen;
/** One decoded class of one frame, as onClass() hands it out. Erased; not a specifier. */
type DecodedClass = import("$lib/protocol").DecodedClass;

/** What onConnection() reports: the fold is registered, or the transport is gone. */
export type ConnectionEvent = "connected" | "closed";

/** The three heavy modules, resolved together on the open path and kept. */
interface HeavyModules {
  protocolLib: Protocol;
  transportLib: Transport;
  deviceLib: Device;
}

/** The part of `navigator.serial` this session uses, as an interface so a node test can hand in a fake - the two event methods included. */
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

/** The eight named states that are failures: the six failureCopy rows and the two authored refusals. S5 is not one. */
type FailurePhase =
  | (typeof FAILURE_COPY_STATES)[number]
  | "not-zona"
  | "silent";

/**
 * The live region's coalescing window (06-UI-SPEC, Accessibility Contract).
 * Everything queued inside it is one utterance, the last one queued.
 */
const SPEECH_WINDOW_MS = 500;

/** The one line the header renders per other module; two lists are equal when these are. */
const moduleKey = (m: ModuleSeen): string =>
  `${m.sx},${m.sy}:${m.hwcfg}:${m.moduleType ?? ""}`;

/**
 * The fold's republish rule, field by field: the active page, the firmware
 * triple, and the other modules by address and type. `lastSeen` is not a
 * rendered field and is not compared.
 */
function renderedFieldsChanged(
  current: Identity,
  next: Identity,
  nextOthers: ModuleSeen[],
): boolean {
  if (current.activePage !== next.activePage) return true;
  const a = current.zona.firmware;
  const b = next.zona.firmware;
  if (a.major !== b.major || a.minor !== b.minor || a.patch !== b.patch) {
    return true;
  }
  if (current.otherModules.length !== nextOthers.length) return true;
  return current.otherModules.some(
    (m, i) => moduleKey(m) !== moduleKey(nextOthers[i]),
  );
}

/**
 * The memoised module promise, awaited only inside #openAdopted, after the
 * chooser: $lib/protocol for the open parameters and the identify window,
 * $lib/transport for WebSerialTransport, $lib/device/try-on for identifyOnly.
 * Module scope on purpose: ES modules are singletons and it carries no
 * session state. The three awaits are sequential; all three share the
 * protocol chunk, which the first fetches.
 */
let heavy: Promise<HeavyModules> | undefined;
async function loadHeavy(): Promise<HeavyModules> {
  const protocolLib = await import("$lib/protocol");
  const transportLib = await import("$lib/transport");
  const deviceLib = await import("$lib/device/try-on");
  return { protocolLib, transportLib, deviceLib };
}
const heavyModules = (): Promise<HeavyModules> => (heavy ??= loadHeavy());

/** The default transport factory: the real open, then the real transport. */
async function openWithWebSerial(port: SerialPort): Promise<GridTransport> {
  const { protocolLib, transportLib } = await heavyModules();
  // MDN's default read buffer is 255 bytes, and a factory Setup config comes
  // back as a 690-byte REPORT; without this it arrives as three chunks.
  await port.open({
    baudRate: protocolLib.BAUD_RATE,
    bufferSize: protocolLib.READ_BUFFER_SIZE,
  });
  return new transportLib.WebSerialTransport(port);
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
  /**
   * What the one live region is saying; "" is silence. Written ONLY by
   * #flushSpeech on the trailing timer and emptied by #say when an utterance
   * is queued, so the same sentence twice in a row is a DOM change each time.
   */
  speech = $state("");
  /**
   * True while an install leg is in flight: set and cleared by the install
   * store (07-06), read by DeviceDetails for the header lock (Z-15) and by
   * every path into `unplugged-while-connected` (Z-11), where the store owns
   * the truer sentence and unpluggedWhileWriting is recorded.
   */
  writeLock = $state(false);
  /**
   * The one modifier on `unplugged-while-connected`, as permissionDeclined is
   * on `cancelled`: set from writeLock at the transition, cleared with every
   * other failure detail. Not a tenth named state.
   */
  unpluggedWhileWriting = $state(false);
  /**
   * How many times a permitted ZONA arrived on the cable in this page's life
   * - a counter, so a second arrival is told from the first. Incremented from
   * #onSerialConnect past its two guards and nowhere else: not the granted
   * port at start(), not `disconnect`, not a click-driven connect, not a
   * failure. Its one reader, FrontDoor's tear, left with the CRT at 13-04
   * (13-CONTEXT D-09); the counter and its tests stay.
   */
  plugged = $state(0);

  // --- NOT reactive: host objects, guards, and the injected environment ----

  /**
   * The install store's class sinks, fed from the fold's one pump and cleared
   * with the fold (a class subscription belongs to ONE connection). A plain
   * Set, never a rune, written four times a second; not a SvelteSet, because
   * svelte/reactivity would be a fifth static specifier.
   */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non-reactive by design; see the comment above
  #classSinks = new Set<(cls: DecodedClass) => void>();
  /**
   * The connection sinks, for the life of the page: the store subscribes once
   * and hears every "connected" and "closed". Non-reactive for #classSinks's
   * reasons.
   */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non-reactive by design; see the comment above
  #connectionSinks = new Set<(ev: ConnectionEvent) => void>();

  /** The utterance waiting for the window to close. Replaced, never queued. */
  #pending: string | undefined;
  /** The trailing timer. A setTimeout, never an interval. */
  #speechTimer: ReturnType<typeof setTimeout> | undefined;
  /** True between holdSpeech() and its release; the flush keeps #pending. */
  #held = false;

  #port: SerialPort | undefined;
  #transport: GridTransport | undefined;
  #serial: SerialLike | undefined;
  #openTransport: (port: SerialPort) => Promise<GridTransport> =
    openWithWebSerial;
  #now: () => number = () => performance.now();
  #pollMs: number | undefined;
  #sleep: ((ms: number) => Promise<void>) | undefined;
  /** The identify window in seconds, for silentBlock; read from the pinned package on the open path, never through a fifth static specifier. */
  #windowSeconds = 0;
  /**
   * The three heavy modules, kept once #openAdopted has awaited them: the
   * fold needs the scanner, the decoder and the accumulator for the life of
   * the connection, and none may be a static specifier here.
   */
  #modules: HeavyModules | undefined;
  /**
   * MODULE_GONE_MS, read from the awaited protocol module like #windowSeconds:
   * a static import of $lib/protocol/constants would put the 131,101-byte
   * chunk on the first paint of `/`, and a `typeof import` alias is erased
   * and cannot carry a VALUE. The watchdog is armed only after `connected`,
   * when the constant is in hand.
   */
  #goneMs = 0;
  /**
   * The fold's accumulator, fresh per connection: the pump checks its identity
   * before absorbing a chunk, so a closed transport's callback never folds
   * into a later connection's state.
   */
  #fold: IdentifyState | undefined;
  /** The watchdog's pending timeout, if armed. Never an interval. */
  #timer: ReturnType<typeof setTimeout> | undefined;
  /**
   * The injected clock at the last heartbeat the fold saw, initialised at
   * `connected`. Kept here, not read off the identity: the fold republishes
   * only on a rendered field, so the snapshot's `lastSeen` goes stale by design.
   */
  #lastSeen = 0;
  /** The in-flight guard. Cleared on every exit path, in a finally. */
  #busy = false;
  /**
   * start() runs once per instance; a second call attaches nothing.
   * Per instance: every test constructs its own session (two call sites,
   * 06-06 and 06-09).
   */
  #started = false;

  // --- start: synchronous, and it opens nothing -----------------------------

  /**
   * Called once, from the root layout's onMount, never at module scope (the
   * prerenderer has no navigator). SYNCHRONOUS: the capability is decided in
   * the calling frame, so `unsupported` and `insecure` render before the
   * first hydrated paint with nothing fetched; the granted-port offer runs
   * afterwards and opens nothing.
   */
  start(env: Partial<SessionEnv> = {}): void {
    if (this.#started) return;
    // THE PRERENDER TRAP: Node 21+ ships a global `navigator` without
    // `serial`, so a bare start() at module scope would quietly decide
    // `unsupported` on every prerendered page (06-09). A bare call belongs in a
    // browser; tests pass an explicit environment and never reach this.
    if (env.serial === undefined && typeof window === "undefined") {
      throw new Error(
        "DeviceSession.start() ran where there is no window - at module scope, or in the prerenderer - so navigator.serial can never be read here. Call it from onMount.",
      );
    }
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
      // "unsupported" | "insecure", decided in this frame: no listeners, no
      // getPorts, nothing fetched.
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
   * The navigator-level connect and disconnect pair, for the life of the page
   * (D-07), never removed. Attached at navigator.serial, not the port
   * (06-RESEARCH): a port can notice a device leaving and never one arriving.
   */
  #attachListeners(): void {
    const serial = this.#serial;
    if (!serial) return;
    serial.addEventListener("connect", this.#onSerialConnect);
    serial.addEventListener("disconnect", this.#onSerialDisconnect);
  }

  /**
   * A permitted ZONA arrived. NOT `ev.target === this.#port`: after a replug
   * this is a NEW SerialPort object (Chromium mints a wired port's token per
   * attach, serial_service.cc:317-325; the permission is keyed by VID, PID and
   * serial and survives), so identify by getInfo() and ADOPT, replacing the
   * dead reference. Lands `detected`, one click away and never an automatic
   * open (D-06); ignored while a transport is live or an open is in flight.
   */
  #onSerialConnect = (ev: Event): void => {
    const port = ev.target as SerialPort | null;
    if (!port || !isZonaPort(port)) return;
    if (this.#transport || this.#busy) return;
    // Past both guards: an arrival that was actually adopted. Set beside
    // #offer, not inside it - #offer is also the granted-port road at start().
    this.plugged += 1;
    this.#offer(port);
  };

  /**
   * The offer, from either road - the granted port found at start(), or a
   * permitted ZONA arriving on the cable: adopt, clear the failure, publish
   * S2, say so once (one of the six #say sites).
   */
  #offer(port: SerialPort): void {
    this.#adopt(port);
    this.#clearFailure();
    this.phase = "detected";
    this.#say(LIVE_DETECTED);
  }

  /**
   * A permitted port left. This comparison IS safe - the pair's asymmetry: on
   * disconnect the browser fires at the object this session holds, so a port
   * that is not ours is another permitted device. Three outcomes: a LIVE
   * session lands `unplugged-while-connected` in this turn and keeps the dead
   * port adopted so forget() can still revoke it; a `detected` port that
   * leaves before it was opened returns to `idle`, not S5 (no session
   * existed to write nothing); any other phase keeps its phase and drops the
   * reference, so the next click goes through the chooser.
   */
  #onSerialDisconnect = (ev: Event): void => {
    if (ev.target !== this.#port) return;
    if (this.#transport) {
      this.#unplugged();
      return;
    }
    if (this.phase === "unplugged-while-connected") return;
    this.#port = undefined;
    this.canForget = false;
    if (this.phase === "detected") this.phase = "idle";
  };

  /**
   * The live session's unplug, from the event or the watchdog: the phase is
   * published FIRST, then the transport released, so "closed" reaches
   * onConnection() after `phase` reads `unplugged-while-connected` (07-04).
   */
  #unplugged(): void {
    this.#publishUnplugged();
    void this.#teardown();
  }

  /**
   * S5, published from every road that reaches it - the event, the watchdog,
   * the transport's own close net - so the unplug is spoken from ONE #say
   * site. Under writeLock the session says NOTHING (Z-11): the install store
   * speaks the true sentence through announce(); the modifier is recorded at
   * the same instant so failureFor() renders the writing form.
   */
  #publishUnplugged(): void {
    this.identity = null;
    this.unpluggedWhileWriting = this.writeLock;
    this.phase = "unplugged-while-connected";
    if (!this.writeLock) this.#say(LIVE_UNPLUGGED);
  }

  /**
   * CONN-06's silent reconnect: getPorts(), no gesture, never open(). The
   * attached filter is `!== false`: Chrome 89-129 has no `connected`, and
   * `undefined` must mean "keep it". An empty list means "not plugged in",
   * never "no grant" (Pitfall 9), so `idle` says nothing about permission.
   */
  async #offerGranted(): Promise<void> {
    const serial = this.#serial;
    if (!serial) return;
    const granted = await grantedZonaPorts(serial);
    const attached = granted.filter((p) => portIsAttached(p) !== false);
    if (attached.length > 0) {
      this.#offer(attached[0]);
    } else {
      this.phase = "idle";
    }
  }

  /** Hold a permitted port without opening it. Replaces any earlier reference. */
  #adopt(port: SerialPort): void {
    this.#port = port;
    // @types declares forget() non-optional; the `in` test is the only real
    // guard (Chrome 103+, Firefox 151+) and decides whether the control renders.
    this.canForget = "forget" in port;
  }

  // --- connect: one action, two call sites, one activation window ----------

  /**
   * MUST be called synchronously from a click handler: requestPort() is the
   * first statement, inside a try (the header's rule). Two controls bind this
   * one action (D-02); #busy makes a double click a no-op rather than a
   * racing open() and an InvalidStateError.
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
   * their phases AND close the port, because both recovery lists say try
   * again. #busy is cleared in the finally on every path.
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
      this.#modules = modules;
      this.#windowSeconds = modules.protocolLib.IDENTIFY_WINDOW_MS / 1000;
      this.#goneMs = modules.protocolLib.MODULE_GONE_MS;

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
      const outcome = await modules.deviceLib.identifyOnly(transport, {
        now: this.#now,
        pollMs: this.#pollMs,
        sleep: this.#sleep,
      });
      // The session moved on while identifyOnly listened (an unplug, a
      // disconnect()): its conclusion is about a transport this session no
      // longer holds.
      if (this.#transport !== transport) return;
      if (outcome.kind === "identified") {
        this.#publish(outcome.identity);
        this.#lastSeen = this.#now();
        this.#startFold(transport);
        this.#armWatchdog();
        this.phase = "connected";
        // Spoken from the identity as identified, ONCE. The fold that keeps
        // this identity current afterwards never speaks (see #publish).
        this.#say(
          liveConnected(
            outcome.identity.zona.firmware,
            outcome.identity.activePage,
          ),
        );
        // The fold is registered and `phase` is `connected`: the install
        // store may now borrow the view and build its queue (plan 07-04).
        this.#connection("connected");
        return;
      }
      if (outcome.kind === "not-zona") {
        this.refusedModule = outcome.moduleType;
        this.#fail("not-zona");
      } else {
        this.#fail("silent");
      }
      await this.#teardown();
    } finally {
      this.#busy = false;
    }
  }

  /**
   * The transport closed under us - a read error, or the port-level
   * disconnect: the net under the navigator-level listener, so a dead port is
   * never still published as `connected`.
   */
  #onTransportClosed(transport: GridTransport): void {
    if (this.#transport !== transport) return; // a teardown this session started
    this.#transport = undefined;
    this.#fold = undefined;
    this.#classSinks.clear();
    this.#disarm();
    this.identity = null;
    if (this.phase === "connected") this.#publishUnplugged();
    // Reported once: the guard above returns on every teardown this session
    // started, and #teardown finds no transport if this ran first.
    this.#connection("closed");
  }

  // --- the continuous fold --------------------------------------------------

  /**
   * Keep listening after identification: GridTransport carries ONE onData
   * callback and whoever registers last owns the stream - from here the
   * session, over a fresh scanner and a fresh accumulator. The module
   * heartbeats at 4 Hz unprompted, so the identity lands within about 250 ms
   * and keeps folding for the life of the connection (CONN-08; a rig's other
   * modules as they announce themselves, D-08). A failed decode is skipped.
   * THIS IS THE ONE onData REGISTRATION THE SESSION EVER MAKES and, since
   * 07-04, the one pump feeding the install store: after the identity has
   * absorbed a frame, every decoded class fans out to the onClass() sinks -
   * identity first, then the queue - each inside its own try.
   */
  #startFold(transport: GridTransport): void {
    const modules = this.#modules;
    if (!modules) return;
    const scanner = new modules.protocolLib.FrameScanner();
    const fold = modules.transportLib.newIdentifyState(this.#now());
    this.#fold = fold;
    transport.onData((chunk) => {
      if (this.#transport !== transport || this.#fold !== fold) return;
      for (const frame of scanner.push(chunk)) {
        const decoded = modules.protocolLib.decodeFrame(frame);
        if (!decoded.ok) continue;
        modules.transportLib.absorbFrame(decoded.classes, fold, this.#now());
        for (const cls of decoded.classes) {
          for (const sink of this.#classSinks) {
            try {
              sink(cls);
            } catch {
              // A subscriber's fault is the subscriber's; the fold goes on.
            }
          }
        }
      }
      const identity = modules.transportLib.identify(fold);
      if (!identity) return;
      this.#lastSeen = identity.zona.lastSeen;
      this.#publish(identity);
    });
  }

  // --- the seams the install store stands on (plan 07-04, D-16) ------------

  /**
   * The open transport as a WRITE VIEW, or undefined; the install store
   * builds its queue on it. Its onData THROWS: this session owns the one data
   * callback after identification (07-RESEARCH Pitfall 1), and the store
   * subscribes through onClass(). The one place this file names `write`,
   * BOUND and never called - which is why the spec's scan stays clean.
   */
  get transport(): GridTransport | undefined {
    const t = this.#transport;
    if (!t) return undefined;
    return {
      get isOpen() {
        return t.isOpen;
      },
      write: t.write.bind(t),
      onData() {
        throw new Error(
          "The session owns the byte stream; subscribe with session.onClass() instead",
        );
      },
      onClose: t.onClose.bind(t),
      close: t.close.bind(t),
    };
  }

  /**
   * Every decoded class from the session's ONE frame pump, for the life of
   * the current connection. Returns the unsubscribe; the Set is cleared with
   * the fold, so a subscription never outlives its transport.
   */
  onClass(cb: (cls: DecodedClass) => void): () => void {
    this.#classSinks.add(cb);
    return () => {
      this.#classSinks.delete(cb);
    };
  }

  /**
   * "connected" once identification has resolved and the fold is registered;
   * "closed" on every teardown, including #teardown on the not-zona and
   * silent paths where no "connected" preceded it (07-06's branch tolerates
   * that). Fired synchronously at the transition: on the hardware-driven
   * roads `phase` already reads `unplugged-while-connected`, on disconnect()
   * and forget() it arrives before their final phase lands. Returns the
   * unsubscribe; never cleared by the session (a for-the-life-of-the-page
   * seam).
   */
  onConnection(cb: (ev: ConnectionEvent) => void): () => void {
    this.#connectionSinks.add(cb);
    return () => {
      this.#connectionSinks.delete(cb);
    };
  }

  /** Speak through the one session live region: a public wrapper over #say, the same window, hold and coalescing (Y-16, Z-17). */
  announce(line: string): void {
    this.#say(line);
  }

  /** Report a connection event to every subscriber, each inside its own try. */
  #connection(ev: ConnectionEvent): void {
    for (const sink of this.#connectionSinks) {
      try {
        sink(ev);
      } catch {
        // A subscriber's fault is the subscriber's; the session goes on.
      }
    }
  }

  /**
   * Replace the published snapshot ONLY when a rendered field changed - the
   * active page, the firmware triple, the sorted other modules - and never on
   * `lastSeen` alone (four replacements a second for a value nothing renders).
   * `otherModules` is sorted by sx, then sy: arrival order is
   * non-deterministic and a self-reordering line reads as a bug.
   */
  #publish(next: Identity): void {
    const others = [...next.otherModules].sort(
      (a, b) => a.sx - b.sx || a.sy - b.sy,
    );
    const current = this.identity;
    if (current && !renderedFieldsChanged(current, next, others)) return;
    this.identity = { ...next, otherModules: others };
  }

  // --- the liveness watchdog ------------------------------------------------

  /**
   * MODULE_GONE_MS is three missed heartbeats (the desktop's isAlive rule,
   * runtime.ts:2426-2430), for ONE case: the MISSED DISCONNECT - a cable
   * pulled at the hub end, a device the OS suspended - which fires no event
   * and, with no traffic of the session's own, no read error. BOTH halves are
   * load-bearing: silent for MODULE_GONE_MS on the injected clock AND
   * portIsAttached(port) === false; `undefined` (Chrome 89-129, no
   * `connected`) never takes this path. Silence alone is not a state: a
   * firmware crash on an attached port leaves `connected`, the taxonomy being
   * nine. A self-rescheduling setTimeout, never setInterval (a hidden tab
   * throttles a timer chain gracefully; the motion contract bans intervals).
   */
  #armWatchdog(): void {
    this.#disarm();
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      if (!this.#transport) return;
      const port = this.#port;
      const gone = this.#now() - this.#lastSeen > this.#goneMs;
      if (gone && port && portIsAttached(port) === false) {
        this.#unplugged();
        return;
      }
      this.#armWatchdog();
    }, this.#goneMs);
  }

  #disarm(): void {
    if (this.#timer === undefined) return;
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  // --- the failure, named synchronously ------------------------------------

  /**
   * Classify what requestPort() or open() threw and put the session in the
   * named state; classifyOpenError is a static import, so nothing is awaited
   * before a failure has a name. One branch sits before it: a NotAllowedError
   * is a declined permission prompt, `cancelled` with the one modifier set
   * (Y-06).
   */
  #refuse(err: unknown, port?: SerialPort): void {
    const raw = err instanceof Error ? err.message : String(err);
    if (err instanceof DOMException && err.name === "NotAllowedError") {
      this.failureKind = "cancelled";
      this.failureRaw = raw;
      this.permissionDeclined = true;
      this.#fail("cancelled");
      return;
    }
    const kind = classifyOpenError(err, port);
    this.failureKind = kind;
    this.failureRaw = raw;
    switch (kind) {
      case "cancelled":
        this.#fail("cancelled");
        return;
      case "port-busy":
        this.#fail("port-busy");
        return;
      case "unplugged":
        // The S6 open failure. The picked object is dead, so the next click
        // goes back through the chooser rather than at a port that is gone.
        this.#port = undefined;
        this.canForget = false;
        this.#fail("unplugged-at-open");
        return;
      default:
        // `already-open` and `unknown` both render through the unknown row;
        // the key is kept so the block reads the already-connecting sentence.
        this.#fail("unknown");
        return;
    }
  }

  /**
   * Publish a failure and say its TITLE, nothing else (06-UI-SPEC, Live
   * region - a failure): every failure phase lands here, so the announcement
   * is one #say site rather than eight. The title is the same whichever
   * surface's label the block renders with, so CONNECT_LABEL serves.
   */
  #fail(phase: FailurePhase): void {
    this.phase = phase;
    const title = this.failureFor(CONNECT_LABEL)?.title;
    if (title) this.#say(title);
  }

  #clearFailure(): void {
    this.failureKind = null;
    this.failureRaw = undefined;
    this.permissionDeclined = false;
    this.refusedModule = undefined;
    this.unpluggedWhileWriting = false;
  }

  /**
   * The one block, for either surface; `label` is the control on the surface
   * rendering it, so no step names a button the visitor cannot see.
   * Synchronous for all nine named states: failureCopy and session-copy
   * import nothing, so nothing is fetched to render a sentence. Any other
   * phase is null.
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
        // The writing form only when the unplug landed under a write (Z-11).
        return unpluggedWhileConnectedBlock(this.unpluggedWhileWriting);
      default:
        return null;
    }
  }

  // --- disconnect ----------------------------------------------------------

  /**
   * Tear down, clear the identity, return to `idle`; the permission is
   * untouched. Spoken only when something WAS connected: the probe page's
   * button is reachable from idle.
   */
  async disconnect(): Promise<void> {
    const wasLive = this.#transport !== undefined;
    await this.#teardown();
    this.identity = null;
    this.#clearFailure();
    this.phase = "idle";
    if (wasLive) this.#say(LIVE_DISCONNECTED);
  }

  /**
   * Revoke this site's permission to see the adopted ZONA (D-10), in the only
   * safe order: close everything, then forget(), then drop every reference -
   * the WICG forget() steps have NO close step. @types declares forget()
   * non-optional, so the `in` test is the only real guard (Chrome 103+,
   * Firefox 151+); canForget came from the same test at adoption. `forgotten`
   * is S7: getPorts() will not return this module again; the chooser is the
   * only way back.
   */
  async forget(): Promise<void> {
    const port = this.#port;
    if (!port || !("forget" in port)) return;
    await this.#teardown();
    await port.forget();
    this.#port = undefined;
    this.identity = null;
    this.#clearFailure();
    this.canForget = false;
    this.phase = "forgotten";
    this.#say(LIVE_FORGOTTEN);
  }

  // --- the one live region's voice ------------------------------------------

  /**
   * Queue an utterance for the next 500 ms trailing window. Called only on a
   * SESSION TRANSITION - detected, connected, disconnected, unplugged,
   * forgotten, and each failure by title - and never on a heartbeat, a
   * page-number change, a paint or a hover. Inside one window the last
   * utterance wins; the region is emptied at once so a repeated sentence is
   * still a change when the window closes.
   */
  #say(line: string): void {
    this.#pending = line;
    this.speech = "";
    this.#queueSpeech();
  }

  /** (Re)start the trailing window. A setTimeout on the state, never an interval. */
  #queueSpeech(): void {
    if (this.#speechTimer !== undefined) clearTimeout(this.#speechTimer);
    this.#speechTimer = setTimeout(() => this.#flushSpeech(), SPEECH_WINDOW_MS);
  }

  /** The window closed. Speak the pending line unless a hold is on, in which case keep it. */
  #flushSpeech(): void {
    this.#speechTimer = undefined;
    if (this.#held) return;
    const line = this.#pending;
    this.#pending = undefined;
    if (line !== undefined) this.speech = line;
  }

  /**
   * Hold every announcement until the returned function is called: FrontDoor
   * holds while the splash covers the row (06-11). Idempotent both ways; a
   * held utterance is replaced, never queued, and is spoken on the same
   * trailing window as everything else when the hold lifts.
   */
  holdSpeech(): () => void {
    this.#held = true;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.#held = false;
      if (this.#pending !== undefined) this.#queueSpeech();
    };
  }

  /**
   * Close whatever is open. Clears the transport and never the port: the port
   * stays adopted so forget() can still revoke it. Reports "closed" ONCE per
   * teardown that had a transport to release, synchronously before the first
   * await, and not at all when there was none; this also runs on the not-zona
   * and silent paths, where no "connected" preceded it (07-04). `readable` is
   * null on a closed port, so the second close runs only on a port something
   * else left open.
   */
  async #teardown(): Promise<void> {
    this.#disarm();
    const transport = this.#transport;
    this.#transport = undefined;
    this.#fold = undefined;
    this.#classSinks.clear();
    if (transport) this.#connection("closed");
    if (transport) await transport.close().catch(() => undefined);
    const port = this.#port;
    if (port && port.readable !== null) {
      await port.close().catch(() => undefined);
    }
  }
}

/** The one instance components read (D-05). Tests never touch it. */
export const session = new DeviceSession();
