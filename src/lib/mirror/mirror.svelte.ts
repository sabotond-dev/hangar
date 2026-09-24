// The live mirror (change 20, docs/MIRROR.md): while a ZONA is connected and the visitor has clicked
// Mirror ZONA, the module's own lights fill a MirrorEngine the simulator host paints, and the MIDI
// the module sent fills a log the monitor reads. READ-ONLY by construction: the only frames this
// file puts on the wire are the host heartbeat HANGAR already sends (TYPE 255) and one LEDPREVIEW
// FETCH, both built by descriptors.ts; it writes no configuration, stores nothing, changes no page
// and sends no Lua (mirror.spec.ts reads the source for anything else).
//
// WHY A HEARTBEAT AT ALL. The module reports its lights only to an editor: a host heartbeat of TYPE
// above 127 marks one connected for 2 s (grid_decode.c:720-726; grid_esp32_port.c:473-481), and
// while it is, every event pass appends a LEDPREVIEW EXECUTE (grid_ui.c:739-760) and every heartbeat
// is answered with a REPORT of what moved (grid_decode.c:729-733). HANGAR sent one heartbeat after
// each write and none otherwise; the mirror sends one every MIRROR_HEARTBEAT_MS until it is switched
// off, and the module's own timeout ends editor mode 2 s later - the restore is silence.
//
// NEVER UNDER A WRITE. The browser refuses a second writer on a port ("The port is busy"), so the
// mirror sends nothing while `quiet()` says the install store is snapshotting, writing, switching
// the page or holds the session's write lock; a beat it could not send is simply the next beat.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { install } from "$lib/device/install.svelte";
import { session } from "$lib/device/session.svelte";
import { ledPreviewRecords, sentMidi } from "$lib/protocol/preview";
import { applyLedRecords, MirrorEngine } from "./frame";

// Type-only references: erased, so none is a runtime specifier.
type DecodedClass = import("$lib/protocol").DecodedClass;
type HostMidi = import("$lib/sim/lua-host").HostMidi;

/**
 * The heartbeat period while mirroring. The Editor's is 300 ms (runtime-manager.store.ts:42); a
 * layer the firmware animates by itself reaches the host only beside a heartbeat, so this number
 * IS the mirror's frame rate for that motion - ten pictures a second for 43 bytes each
 * (docs/MIRROR.md section 5). Everything a configuration repaints from its own timer or touch
 * callback arrives at its own rate whatever this is.
 */
export const MIRROR_HEARTBEAT_MS = 100;

/** How long the plate waits for a first LED report before it says none came: the module's own editor timeout. */
export const MIRROR_SILENT_MS = 2000;

/**
 * The most MIDI messages one mirror session keeps. The log is read by position (MonitorLog), so it
 * is EMPTIED rather than trimmed when it reaches this; the monitor reads an empty log as a restart
 * and loses nothing it had shown.
 */
export const MIRROR_MIDI_CAP = 20_000;

/** off: the simulator is on the plate. starting: the click landed, the first frames are going out. on: mirroring. */
export type MirrorState = "off" | "starting" | "on";

/** What the mirror needs of the device session - DeviceSession satisfies it; a node test hands in a fake. */
export interface MirrorLink {
  readonly phase: string;
  readonly identity: {
    readonly zona: { readonly sx: number; readonly sy: number };
    readonly activePage: number;
  } | null;
  readonly transport: { write(data: Uint8Array): Promise<void> } | undefined;
  onClass(cb: (cls: DecodedClass) => void): () => void;
  onConnection(cb: (ev: "connected" | "closed") => void): () => void;
}

/** The two builders the mirror may send, and the encoder. Loaded on the click, never at module scope. */
interface MirrorWire {
  hostHeartbeat: typeof import("$lib/protocol").hostHeartbeat;
  fetchLedPreview: typeof import("$lib/protocol").fetchLedPreview;
  encodeRequest: typeof import("$lib/protocol").encodeRequest;
}

export interface MirrorEnv {
  link: MirrorLink;
  /** True while another writer owns the port: the mirror sends nothing then. */
  quiet: () => boolean;
  /** The protocol surface, awaited on the click. Injected so a node test can count what is built. */
  wire?: () => Promise<MirrorWire>;
  setTimer?: (cb: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

const loadWire = async (): Promise<MirrorWire> => {
  const P = await import("$lib/protocol");
  return {
    hostHeartbeat: P.hostHeartbeat,
    fetchLedPreview: P.fetchLedPreview,
    encodeRequest: P.encodeRequest,
  };
};

export class MirrorStore {
  // --- reactive: scalars only ------------------------------------------------
  state = $state<MirrorState>("off");
  /** A LED report from the ZONA has arrived since the click. */
  lit = $state(false);
  /** None had arrived MIRROR_SILENT_MS after the click. */
  silent = $state(false);

  // --- not reactive: the picture, the log, the machinery ----------------------
  /** The engine the host paints while mirroring. One per store, its frame rewritten in place. */
  readonly engine = new MirrorEngine();
  /** What the ZONA sent, oldest first; a fresh array on every click. The monitor reads it by position. */
  midi: HostMidi[] = [];

  readonly #env: MirrorEnv;
  readonly #setTimer: (cb: () => void, ms: number) => unknown;
  readonly #clearTimer: (handle: unknown) => void;
  /** Plain, never reactive: callbacks, not state a component renders (session.svelte.ts's #classSinks, the same rule). */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- non-reactive by design; see the line above
  #frameSinks = new Set<() => void>();
  #unsubscribe: (() => void)[] = [];
  #beatTimer: unknown;
  #silentTimer: unknown;
  #wire: MirrorWire | undefined;
  /** The full report has been asked for since the click. */
  #fetched = false;
  /** A beat's writes are still in flight; the next one waits for them. */
  #beating = false;
  /** Bumped on every start and stop, so a late await from an earlier click does nothing. */
  #generation = 0;

  constructor(env: MirrorEnv) {
    this.#env = env;
    this.#setTimer =
      env.setTimer ?? ((cb, ms) => setTimeout(cb, ms) as unknown);
    this.#clearTimer =
      env.clearTimer ??
      ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>));
  }

  /** The capability: a ZONA identified on an open link. Never the browser. */
  get available(): boolean {
    const link = this.#env.link;
    return link.phase === "connected" && link.identity !== null;
  }

  /** Called on every LED report that changed the picture; the page hands the host's invalidate. */
  onFrame(cb: () => void): () => void {
    this.#frameSinks.add(cb);
    return () => {
      this.#frameSinks.delete(cb);
    };
  }

  /** The click. Does nothing unless a ZONA is connected and the mirror is off. */
  async start(): Promise<void> {
    if (this.state !== "off" || !this.available) return;
    const mine = ++this.#generation;
    this.state = "starting";
    this.lit = false;
    this.silent = false;
    this.#fetched = false;
    this.midi = [];
    this.engine.clear();
    this.#notify();

    const link = this.#env.link;
    this.#unsubscribe = [
      link.onClass((cls) => this.#absorb(cls)),
      link.onConnection((ev) => {
        if (ev === "closed") this.stop();
      }),
    ];

    let wire: MirrorWire;
    try {
      wire = await (this.#env.wire ?? loadWire)();
    } catch {
      if (mine === this.#generation) this.stop();
      return;
    }
    if (mine !== this.#generation) return;
    this.#wire = wire;
    this.state = "on";
    this.#silentTimer = this.#setTimer(() => {
      if (mine === this.#generation && !this.lit) this.silent = true;
    }, MIRROR_SILENT_MS);
    await this.#beat(mine);
  }

  /** The second click, a disconnect, leaving the page or Play. Sends nothing: the heartbeats stop. */
  stop(): void {
    this.#generation++;
    for (const off of this.#unsubscribe) off();
    this.#unsubscribe = [];
    if (this.#beatTimer !== undefined) this.#clearTimer(this.#beatTimer);
    if (this.#silentTimer !== undefined) this.#clearTimer(this.#silentTimer);
    this.#beatTimer = undefined;
    this.#silentTimer = undefined;
    this.#beating = false;
    this.state = "off";
  }

  /** The click's toggle. */
  toggle(): void {
    if (this.state === "off") void this.start();
    else this.stop();
  }

  /**
   * One heartbeat - the first also asks for the full report - then the next beat scheduled. A beat
   * under quiet() or a failed write sends nothing more and is simply the next beat.
   */
  async #beat(mine: number): Promise<void> {
    if (mine !== this.#generation) return;
    const wire = this.#wire;
    const transport = this.#env.link.transport;
    const zona = this.#env.link.identity?.zona;
    if (
      !this.#beating &&
      wire !== undefined &&
      transport !== undefined &&
      zona !== undefined &&
      !this.#env.quiet()
    ) {
      this.#beating = true;
      try {
        await transport.write(wire.encodeRequest(wire.hostHeartbeat()).bytes);
        if (!this.#fetched && mine === this.#generation) {
          await transport.write(
            wire.encodeRequest(wire.fetchLedPreview(zona.sx, zona.sy)).bytes,
          );
          this.#fetched = true;
        }
      } catch {
        // A heartbeat that could not be written is dropped; the next beat tries again.
      } finally {
        if (mine === this.#generation) this.#beating = false;
      }
    }
    if (mine !== this.#generation) return;
    this.#beatTimer = this.#setTimer(
      () => void this.#beat(mine),
      MIRROR_HEARTBEAT_MS,
    );
  }

  /** One decoded class from the session: the ZONA's own LED report or sent MIDI, nothing else. */
  #absorb(cls: DecodedClass): void {
    const zona = this.#env.link.identity?.zona;
    if (zona === undefined) return;
    if (
      Number(cls.brc_parameters.SX) !== zona.sx ||
      Number(cls.brc_parameters.SY) !== zona.sy
    ) {
      return;
    }
    const leds = ledPreviewRecords(cls);
    if (leds !== undefined) {
      applyLedRecords(this.engine.frame, leds);
      if (!this.lit) {
        this.lit = true;
        this.silent = false;
      }
      this.#notify();
      return;
    }
    const sent = sentMidi(cls);
    if (sent === undefined) return;
    if (this.midi.length >= MIRROR_MIDI_CAP) this.midi = [];
    this.midi.push({ ...sent, mode: 0 });
  }

  #notify(): void {
    for (const sink of this.#frameSinks) {
      try {
        sink();
      } catch {
        // A page that went away mid-report does not stop the others.
      }
    }
  }
}

/**
 * The install store's writers, as one predicate: the snapshot's fetches, a write leg, a page switch
 * in flight and the session's write lock all own the port while they run.
 */
const installOwnsThePort = (): boolean =>
  session.writeLock ||
  install.phase === "snapshotting" ||
  install.phase === "writing" ||
  install.pageStatus === "requested" ||
  install.pageStatus === "switching";

/** The site's one mirror, over the site's one session. Every node test constructs its own. */
export const mirror = new MirrorStore({
  link: session,
  quiet: installOwnsThePort,
});
