// The device session: one object that owns the port, the identity, the phase
// and the failure, for the life of the page (D-05).
//
// TWO PLANS, ONE FILE. Capability, the granted-port offer, the chooser,
// opening and identification are 06-03: the half the visitor drives. The
// navigator-level connect and disconnect listener pair, the replug adoption,
// the continuous fold, the liveness watchdog and forget() are 06-04: the half
// the hardware drives, which only happens after the cable is already in.
//
// THE REPLUG IDENTITY TRAP, WHICH SHAPES BOTH LISTENERS. Chromium keys a wired
// port's JS object by a token the enumerator mints fresh on every physical
// attach (content/browser/serial/serial_service.cc:317-325 returns nullopt
// from GetPersistentIdentifier for every non-Bluetooth port, so ToBlinkType
// passes the enumerator's token straight through, and serial.cc:441-452
// caches SerialPort objects by that token). So `disconnect` fires AT THE
// OBJECT THIS SESSION HOLDS and may be matched by identity, while `connect`
// after a replug fires at a DIFFERENT OBJECT and may not: it is matched by
// getInfo() and the arriving object is ADOPTED in place of the dead one. The
// permission is untouched by any of this - SerialChooserContext keys it by
// VID, PID and the module's per-chip serial number, never by the token -
// which is why getPorts() returns the replugged module at once and the
// replug offer needs no picker.
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
// store, and no call to any transport's write. session.spec.ts test 15 asserts
// that twice: against a transport that records every byte across a whole
// visit, and as a property of this file's comment-stripped source. Since plan
// 07-04 this file HANDS OUT a writer behind a getter - the `transport` view
// below - and still never calls it: the view is built by BINDING the open
// transport's write rather than by calling it, so the scan's `.write(` needle
// finds nothing, and the one place this file names `write` is that binding.
//
// WHY THE INSTALL STORE IS A SEPARATE FILE AND WHAT IT BORROWS (plan 07-04,
// 07-CONTEXT D-16). Every write of this site lives in install.svelte.ts (plan
// 07-06), never here, so that test 15's eight write-shaped needles keep
// meaning what they meant in Phase 6. The store borrows six members: the
// `transport` view, whose onData THROWS on purpose (GridTransport carries one
// data callback and this session owns it after identification - a second raw
// registration would silently unhook the fold that keeps the page number and
// the rig tail true, 07-RESEARCH Pitfall 1); onClass(), the class sink fed
// from the fold's one pump, which is how the store's queue sees every
// acknowledgement; onConnection(), so the store can snapshot at "connected"
// and abort at "closed" without a Svelte effect; announce(), so its twelve
// utterances go through the one live region; and writeLock with
// unpluggedWhileWriting, which lock the header's two controls under a write
// (Z-15) and keep this session's own unplug sentence quiet when the store has
// the truer one (Z-11). All six are scalars, $state.raw snapshots, a Set of
// callbacks and bound methods; none is a fifth static specifier.
//
// WHAT IT SAYS, AND WHERE THAT IS DECIDED (plan 06-09, D-17). The one session
// live region renders `speech` and nothing else; every rule about WHEN it
// changes lives here, where a node test can reach it. #say is called from
// exactly six session sites - #offer (detected), #openAdopted (connected),
// disconnect(), #publishUnplugged, forget(), and #fail (every failure, by its
// title) - and from the public announce() wrapper, through which the install
// store's own utterances arrive (plan 07-04), and from nowhere else. The
// fold's republish path, the watchdog and the identity's page number never
// speak: a module reporting its page four times a second would otherwise turn
// a screen reader into a metronome. Utterances inside one 500 ms window
// coalesce to the last one on a trailing setTimeout (never an interval), and
// holdSpeech() lets the front door keep the region silent while the splash
// covers the row.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
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

// Type-only references. Erased at compile time, so none of these is a
// specifier the chunk guard can see, and none costs a byte on the load path.
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
  P: Protocol;
  T: Transport;
  D: Device;
}

/**
 * The part of `navigator.serial` this session uses, as an interface so a node
 * test can hand in a fake - including the two event methods the listener pair
 * in #attachListeners goes through.
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
  /**
   * What the one live region is currently saying. Empty string means silence.
   * Written ONLY by #flushSpeech, on the trailing timer, and emptied by #say
   * when an utterance is queued - so the same sentence twice in a row (a
   * chooser closed twice) is a DOM change each time and is heard each time.
   */
  speech = $state("");
  /**
   * True while an install leg is in flight. Set and cleared by the install
   * store (plan 07-06), read by DeviceDetails for the header lock (Z-15) and
   * by every path into `unplugged-while-connected` (Z-11): when true, the
   * session says nothing on the unplug - the install store owns the truer
   * sentence - and records unpluggedWhileWriting so the disclosure renders
   * the writing form.
   */
  writeLock = $state(false);
  /**
   * The one modifier on `unplugged-while-connected`, exactly as
   * permissionDeclined is the one on `cancelled`: set from writeLock at the
   * moment of the transition, cleared with every other failure detail. Not a
   * tenth named state and not an eighteenth phase.
   */
  unpluggedWhileWriting = $state(false);
  /**
   * HOW MANY TIMES A PERMITTED ZONA HAS ARRIVED ON THE CABLE in this page's
   * life. A monotonic counter and not a boolean, because the one thing reading
   * it - FrontDoor.svelte's 180 ms tear on `.crt-band::after` (10-UI-SPEC 8.4)
   * - has to be able to tell a second arrival from the first, and a flag that
   * went true twice would fire once.
   *
   * INCREMENTED FROM #onSerialConnect AND FROM NOWHERE ELSE, past its two
   * guards, so it counts exactly the event the tear is about: real hardware
   * physically plugged in, the one thing that happens on this site that the
   * visitor did not start with a click. NOT the granted port found at start()
   * - that is a page load, not an arrival - NOT `disconnect`, NOT a click-
   * driven connect, and NOT any failure. One surface, one event.
   *
   * There is no second navigator.serial listener anywhere for this: the pair
   * attached in #attachListeners is the only one, and this is a field on the
   * handler it already has.
   */
  plugged = $state(0);

  // --- NOT reactive: host objects, guards, and the injected environment ----

  /**
   * The install store's class sinks, fed from the fold's one pump and cleared
   * with the fold: a class subscription is a property of ONE connection, so
   * a store that outlives a teardown subscribes again on the next
   * "connected". A plain Set, never a rune - it is written in a callback that
   * runs four times a second. Deliberately NOT a SvelteSet: nothing renders
   * it, and svelte/reactivity would be a fifth static specifier.
   */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non-reactive by design; see the comment above
  #classSinks = new Set<(cls: DecodedClass) => void>();
  /**
   * The connection sinks, for the life of the page: the store subscribes once
   * and hears every "connected" and every "closed" this instance ever emits.
   * Non-reactive for the same two reasons as #classSinks.
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
  /**
   * The identify window in seconds, for silentBlock. Read from the pinned
   * package on the open path - the only path from which `silent` can be
   * reached - so the sentence and the wait it describes come from the same
   * constant, and never through a fifth static specifier.
   */
  #windowSeconds = 0;
  /**
   * The three heavy modules, kept once #openAdopted has awaited them, because
   * the fold below needs the scanner, the decoder and the accumulator for the
   * life of the connection and none of those may be a static specifier here.
   */
  #modules: HeavyModules | undefined;
  /**
   * MODULE_GONE_MS, read from the same awaited module as #windowSeconds and
   * stored here - NOT through a fifth static specifier. $lib/protocol/constants
   * imports @intechstudio/grid-protocol at module scope, so a static import of
   * it would put the 131,101-byte chunk on the first paint of `/` and undo the
   * whole of the four-specifier discipline above; and a `typeof import(...)`
   * alias cannot help either, because it is erased and this is a VALUE. The
   * watchdog is only ever armed once `connected` has been reached, which is
   * strictly after #openAdopted resolved that module, so the constant is in
   * hand by then and no new fetch happens. If a later plan needs it before a
   * connection exists, it moves to $lib/protocol/usb.ts beside ZONA_USB rather
   * than this rule bending.
   */
  #goneMs = 0;
  /**
   * The fold's accumulator, fresh per connection. Its identity is what the
   * pump checks before absorbing a chunk, so a callback a closed transport
   * still holds can never fold into a later connection's state.
   */
  #fold: IdentifyState | undefined;
  /** The watchdog's pending timeout, if armed. Never an interval. */
  #timer: ReturnType<typeof setTimeout> | undefined;
  /**
   * The injected clock's reading at the last heartbeat the fold saw from the
   * ZONA, initialised when `connected` is reached. Kept here rather than read
   * off the published identity: the fold republishes only when a rendered
   * field changes, so the snapshot's own `lastSeen` is deliberately allowed to
   * go out of date and would keep a watchdog reading it silent for ever.
   */
  #lastSeen = 0;
  /** The in-flight guard. Cleared on every exit path, in a finally. */
  #busy = false;
  /**
   * start() runs once per instance; a second call is a no-op rather than a
   * second listener pair. TWO CALL SITES: the session probe page starts the
   * singleton from its own onMount (plan 06-06), and the root layout starts
   * it for the whole site (plan 06-09) - so on the probe route both run, and
   * whichever is second must attach nothing.
   *
   * An INSTANCE field, not a module-scope flag, on purpose: every node test
   * constructs its own DeviceSession, and a module-scope flag would be shared
   * across instances, so the second test in session.spec.ts would find
   * start() already spent and would silently assert against a session that
   * never attached a listener.
   */
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
    // THE PRERENDER TRAP, and why this throws instead of deciding. Node 21 and
    // later ship a global `navigator` WITHOUT `serial`, so a bare start() at
    // module scope - which the prerenderer runs - would not fail: it would
    // quietly decide `unsupported`, and every prerendered page would ship the
    // S0a slot and no header note, with the build green (observed by plan
    // 06-09). A bare call is a component's; a component's bare call belongs
    // in a browser. Tests pass an explicit environment and never reach this.
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
   * the page (D-07), and never removed: the session lives as long as the page
   * does. Phase 2's transport listens on the PORT, which can notice a device
   * leaving and never one arriving; both events belong on the serial object.
   */
  #attachListeners(): void {
    const serial = this.#serial;
    if (!serial) return;
    serial.addEventListener("connect", this.#onSerialConnect);
    serial.addEventListener("disconnect", this.#onSerialDisconnect);
  }

  /**
   * A permitted ZONA arrived. NOT `ev.target === this.#port`: after a replug
   * this is a NEW SerialPort object (serial_service.cc:317-325, see the
   * header), so the comparison would wait for ever and the replug half of
   * CONN-06 would silently never happen. Identify by getInfo() and ADOPT -
   * which REPLACES the stored reference rather than merging with it. The old
   * object is dead the moment the module left; keeping it produces a
   * NetworkError at the next open, at best.
   *
   * The result is `detected`: one click away, and never an automatic open
   * (D-06). An arrival while a transport is live, or while an open is in
   * flight, is ignored - the session is already talking to something, or the
   * chooser is about to decide.
   */
  #onSerialConnect = (ev: Event): void => {
    const port = ev.target as SerialPort | null;
    if (!port || !isZonaPort(port)) return;
    if (this.#transport || this.#busy) return;
    // Past both guards, so this counts an arrival that was actually adopted.
    // The only reader is the tear (10-UI-SPEC 8.4); nothing about the session's
    // own behaviour changes with it, which is why it is set beside #offer
    // rather than inside it - #offer is also the granted-port road at start().
    this.plugged += 1;
    this.#offer(port);
  };

  /**
   * The offer, from either road to it - the granted port found at start(), or
   * a permitted ZONA arriving on the cable. Adopt, clear whatever failure the
   * visitor was reading, publish S2, and say so once. ONE of the six #say
   * sites: both roads land here so `detected` is spoken from one line.
   */
  #offer(port: SerialPort): void {
    this.#adopt(port);
    this.#clearFailure();
    this.phase = "detected";
    this.#say(LIVE_DETECTED);
  }

  /**
   * A permitted port left. This comparison IS safe, and it is the asymmetry
   * of the pair: on disconnect the browser fires at the object this session
   * is holding (RemovePort flips its `connected` and forwards the event at
   * that same token), so a port that is not ours is some other permitted
   * device and none of our business.
   *
   * Three outcomes. A LIVE session lands in `unplugged-while-connected` - in
   * this same turn, before any click and without waiting for a failed write -
   * and keeps the dead port adopted so forget() can still revoke it (S5 renders
   * that control). A `detected` port that leaves before it was ever opened
   * returns to `idle`, not to S5: Phase 4's sentence says "Nothing was
   * written" about a session that existed, and there was none. Any other
   * phase holding a dead port - a failure the visitor is still reading, or a
   * session the transport's own net already flipped - keeps its phase, and
   * only the reference is dropped, so the next click goes back through the
   * chooser rather than at an object that is gone.
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
   * The live session's unplug, from either the event or the watchdog. The
   * phase is published FIRST, then the transport is released, so the "closed"
   * that #teardown reports to onConnection() subscribers arrives after
   * `phase` already reads `unplugged-while-connected` (plan 07-04).
   */
  #unplugged(): void {
    this.#publishUnplugged();
    void this.#teardown();
  }

  /**
   * S5, published from every road that reaches it - the navigator-level
   * event, the watchdog, and the transport's own close net - so the unplug
   * is spoken from ONE of the six #say sites rather than from each road.
   *
   * Under writeLock the session says NOTHING here (Z-11): Phase 6's sentence
   * ends "Nothing was written", which is false when a write was in flight,
   * and the install store speaks the true one through announce(). The
   * modifier is recorded at the same instant so failureFor() renders the
   * writing form of the disclosure for as long as this phase stands.
   */
  #publishUnplugged(): void {
    this.identity = null;
    this.unpluggedWhileWriting = this.writeLock;
    this.phase = "unplugged-while-connected";
    if (!this.writeLock) this.#say(LIVE_UNPLUGGED);
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
      this.#offer(attached[0]);
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
      this.#modules = modules;
      this.#windowSeconds = modules.P.IDENTIFY_WINDOW_MS / 1000;
      this.#goneMs = modules.P.MODULE_GONE_MS;

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
      // The session moved on while identifyOnly was listening - an unplug, a
      // disconnect() - so whatever it concluded is about a transport this
      // session no longer holds, and publishing it would overwrite the state
      // the listener already set.
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
   * The transport closed under us - a read error, or the transport's own
   * port-level disconnect. The navigator-level listener is the primary path to
   * `unplugged-while-connected`; this is the net under it, so a dead port is
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
    // Reported once: the guard above returns before this line on every
    // teardown this session started, and #teardown found no transport to
    // report if this ran first.
    this.#connection("closed");
  }

  // --- the continuous fold --------------------------------------------------

  /**
   * Keep listening after identification. identifyOnly registered the
   * transport's single onData callback and returned; GridTransport carries ONE
   * callback, so whoever registers last owns the byte stream, and from here
   * that is the session, over a fresh scanner and a fresh accumulator. The
   * module heartbeats at 4 Hz unprompted, so the rebuilt identity lands within
   * about 250 ms and keeps folding for the life of the connection: the page
   * number on screen is the page the module is on rather than a snapshot from
   * connect time (CONN-08), and a rig's other modules appear as they announce
   * themselves (D-08). The heartbeat is also what the watchdog listens for.
   *
   * A decode that fails is skipped, as identifyOnly skips it: the guard returns
   * undefined on every failure exit and never a wrong answer, and the next
   * frame is 250 ms away.
   *
   * THIS IS THE ONE onData REGISTRATION THE SESSION EVER MAKES, and since plan
   * 07-04 it is also the one pump that feeds the install store: after the
   * identity has absorbed a frame, every decoded class of it is fanned out to
   * the onClass() sinks - identity first, then the queue, the order the
   * skeleton page and the desktop's message stream both use. Each sink runs
   * inside its own try, so one subscriber that throws cannot stop the fold or
   * starve the sink beside it; the identity below is computed whatever a sink
   * did.
   */
  #startFold(transport: GridTransport): void {
    const modules = this.#modules;
    if (!modules) return;
    const scanner = new modules.P.FrameScanner();
    const fold = modules.T.newIdentifyState(this.#now());
    this.#fold = fold;
    transport.onData((chunk) => {
      if (this.#transport !== transport || this.#fold !== fold) return;
      for (const frame of scanner.push(chunk)) {
        const decoded = modules.P.decodeFrame(frame);
        if (!decoded.ok) continue;
        modules.T.absorbFrame(decoded.classes, fold, this.#now());
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
      const identity = modules.T.identify(fold);
      if (!identity) return;
      this.#lastSeen = identity.zona.lastSeen;
      this.#publish(identity);
    });
  }

  // --- the seams the install store stands on (plan 07-04, D-16) ------------

  /**
   * The open transport, as a WRITE VIEW, or undefined. Phase 7's install store
   * borrows it to build its RequestQueue. Its onData THROWS: GridTransport
   * carries exactly one data callback and this session owns it after
   * identification - a second registration would silently unhook the fold
   * that keeps the page number and the rig tail true (07-RESEARCH Pitfall 1).
   * The install store subscribes through onClass() instead. This is the one
   * place this file names `write`, and it still never calls it: the method is
   * BOUND, not called, which is also why test 15's scan stays clean.
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
   * the current connection. Returns the unsubscribe. The Set is cleared with
   * the fold, so a subscription never outlives the transport it was made on.
   */
  onClass(cb: (cls: DecodedClass) => void): () => void {
    this.#classSinks.add(cb);
    return () => {
      this.#classSinks.delete(cb);
    };
  }

  /**
   * "connected" once identification has resolved and the fold is registered;
   * "closed" on every teardown - unplug, disconnect(), forget(), a read
   * error, the missed-disconnect watchdog - AND from #teardown on the
   * not-zona and silent paths, where no "connected" ever preceded it: a
   * subscriber must tolerate a "closed" with nothing to close (07-06's branch
   * does). Fired synchronously at the transition. On the hardware-driven
   * roads (the unplug event, the watchdog, the transport's own close net)
   * `phase` already reads `unplugged-while-connected` when "closed" arrives;
   * on the visitor-driven roads (disconnect(), forget()) it arrives as the
   * transport is released, before their final `idle` or `forgotten` lands,
   * because those two still have to await the port. Returns the unsubscribe.
   * Never cleared by the session: this is a for-the-life-of-the-page seam.
   */
  onConnection(cb: (ev: ConnectionEvent) => void): () => void {
    this.#connectionSinks.add(cb);
    return () => {
      this.#connectionSinks.delete(cb);
    };
  }

  /**
   * Speak through the one session live region. A public wrapper over #say
   * and nothing more: the same 500 ms trailing window, the same hold, the
   * same last-one-wins coalescing (Y-16, Z-17).
   */
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
   * Replace the published snapshot ONLY when a rendered field changed: the
   * active page, the firmware triple, or the sorted list of other modules.
   * Never on `lastSeen` alone - that would replace a $state.raw snapshot four
   * times a second for a value nothing renders, and every reader of `identity`
   * would re-run for it.
   *
   * `otherModules` is sorted by sx, then sy. The accumulator's own order is
   * arrival order, which is non-deterministic across runs, and a line that
   * reorders itself between two loads reads as a bug.
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
   * MODULE_GONE_MS is three missed heartbeats - the desktop's isAlive rule
   * (runtime.ts:2426-2430). This watchdog exists for ONE case: the MISSED
   * DISCONNECT. A module can leave without an event - a cable pulled at the
   * hub end, a browning-out hub, a device the OS suspended - and a connected
   * session with no traffic of its own produces no read error either, so
   * nothing else on this page would notice. Armed when `connected` is
   * reached, disarmed by every teardown.
   *
   * BOTH halves of the condition are load-bearing. The module must have been
   * silent for MODULE_GONE_MS on the injected clock, AND the OS must report
   * the port no longer attached. portIsAttached() returning `undefined` -
   * Chrome 89-129, which has no `connected` property - is NOT `false`, so an
   * older Chromium never takes this path and keeps the session until a real
   * event or a read error arrives. That is the right failure: the alternative
   * is tearing a live connection down on a browser that cannot answer the
   * question.
   *
   * It publishes no field of its own. Silence ALONE is not a state: a firmware
   * crash on a port the OS still reports as attached leaves the session in
   * `connected`, deliberately, because the taxonomy is nine and this phase
   * renders no tenth.
   *
   * A self-rescheduling setTimeout, never setInterval: a timer chain is what a
   * hidden tab throttles gracefully, and an interval is what the motion
   * contract bans.
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
   * Publish a failure and say its TITLE, and nothing else (06-UI-SPEC, Live
   * region - a failure). Every one of the eight failure phases lands here, so
   * the announcement is one of the six #say sites rather than eight. The
   * title is the same whichever surface's label the block is rendered with -
   * only the steps interpolate a label - so CONNECT_LABEL is simply the one
   * this module already holds.
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
        // The writing form only when the unplug landed under a write (Z-11).
        return unpluggedWhileConnectedBlock(this.unpluggedWhileWriting);
      default:
        return null;
    }
  }

  // --- disconnect ----------------------------------------------------------

  /**
   * Tear down, clear the identity, return to `idle`. The permission is
   * untouched. Spoken only when something WAS connected: a disconnect that
   * disconnected nothing is not a transition, and the probe page's button is
   * reachable from idle.
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
   * safe order. The WICG forget() steps remove the port from the permitted
   * sequence and resolve - there is NO close step - so a naive implementation
   * revokes the permission while still holding the port, telling the visitor
   * HANGAR has forgotten their module while it is still talking to it. So:
   * close everything first, then forget, then drop every reference.
   *
   * @types/w3c-web-serial declares forget() non-optional, so the `in` test is
   * the only real guard (Chrome 103+, Firefox 151+). canForget was set from
   * the same test at adoption and is what decides whether the control renders
   * at all; on a port without it this is a no-op that moves nothing.
   *
   * `forgotten` is S7: getPorts() will not return this module again, and the
   * only way back is the chooser.
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
   * SESSION TRANSITION: detected, connected, disconnected, unplugged,
   * forgotten, and each failure by title. NEVER on a heartbeat, a page-number
   * change, a paint or a hover - a module reporting its page four times a
   * second would turn a screen reader into a metronome. Inside one window the
   * last utterance wins; the region is emptied at once so that a repeat of the
   * sentence already on it is still a change when the window closes.
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
   * Hold every announcement until the returned function is called. FrontDoor
   * holds while the splash covers the row (plan 06-11), so a ZONA detected
   * during the opening is announced once, after it, rather than over it.
   * Idempotent - a second hold does not stack, and a second release is a
   * no-op - and a held utterance is replaced rather than queued: only the
   * latest state is worth speaking when the hold lifts, and it is spoken on
   * the same trailing window as everything else.
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
   * Close whatever is open. Clears the transport and never the port: the
   * port object stays adopted so forget() can still revoke it.
   *
   * WebSerialTransport.close() closes the port it wraps; an injected transport
   * may not own the port at all. `readable` is null on a closed port, so the
   * second close only ever runs on a port something else left open.
   *
   * Reports "closed" to onConnection() subscribers ONCE per teardown that had
   * a transport to release, synchronously, before the first await - and not
   * at all when there was none, so disconnect() on an already closed session
   * reports nothing. This also runs on the not-zona and silent paths, where
   * no "connected" ever preceded it (plan 07-04).
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
