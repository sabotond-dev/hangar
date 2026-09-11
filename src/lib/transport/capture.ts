// The frame recorder (D-07): every byte in both directions, on the record.
//
// One schema for two consumers - the page's "Export JSON" button and
// FakeTransport's input are the same object, so replaying a run needs no
// conversion step and a fixture cannot drift from what the page writes.
//
// Append-only, no ring buffer. A 60 second run is about 240 heartbeat frames
// plus a handful of transactions, roughly 30 KB; truncating the log is exactly
// how you lose the frame that explains the failure.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { DecodedClass, DecodedFrame } from "$lib/protocol";

export const CAPTURE_SCHEMA = "hangar.skeleton.capture/1";

export type CaptureEvent =
  | { n: number; t: number; dir: "tx"; kind: "bytes"; hex: string }
  | { n: number; t: number; dir: "rx"; kind: "chunk"; hex: string }
  | {
      n: number;
      t: number;
      dir: "rx";
      kind: "frame";
      hex: string;
      ok: true;
      classes: DecodedClass[];
    }
  | {
      n: number;
      t: number;
      dir: "rx";
      kind: "frame";
      hex: string;
      ok: false;
      reason: string;
    };

/**
 * The step vocabulary, pinned here so plan 03's sequence, the page's status
 * list, the exported capture and plan 05's post-checkpoint gate all name the
 * same things. A gate that asserts a step id cannot be written against ids
 * that are only discovered after the hardware run.
 */
export const STEP_IDS = [
  "identify",
  // Phase 7 (07-01): the module's own key, fetched before the snapshot.
  "fetch-serial",
  // Phase 12 (12-02): the system element's setup - the page-init slot the
  // library lives in. The three `-system` ids were ADDED beside the four touch
  // ids, never in place of them, and the four touch ids are byte-unchanged:
  // 12-03 then moved the store onto all six fetch and write ids at once.
  "fetch-system",
  "fetch-setup",
  "fetch-timer",
  "write-system",
  "write-timer",
  "write-setup",
  "store",
  "refetch-system",
  "refetch-setup",
  "refetch-timer",
  "restore-page-change",
  "burst",
  // Phase 13 (13-12): the page target. `switch-page` is the fire-and-forget
  // page switch (sendImmediate, no reply exists to wait for);
  // `fetch-page-count` the enumeration; `discard` the firmware-native revert,
  // unproven. Added beside the fourteen, none of which moved.
  "switch-page",
  "fetch-page-count",
  "discard",
] as const;
export type StepId = (typeof STEP_IDS)[number];

export interface CaptureStep {
  id: StepId;
  descr: string;
  requestId?: number;
  sentAt?: number;
  settledAt?: number;
  latencyMs?: number;
  attempts: number;
  outcome: "ok" | "nack" | "timeout" | "aborted" | "sent";
  matchedOn?: string[];
  error?: string;
}

export interface CaptureRun {
  id: string;
  hostHeartbeat: { enabled: boolean; intervalMs: number; type: number };
  pacing: { preSendDelayMs: number };
  timeouts: { fetchMs: number; executeMs: number; pagestoreMs: number };
  retries: number;
  userAgent: string;
  origin: string;
  protocolPin: string;
}

export interface CaptureIdentity {
  usbVendorId: number;
  usbProductId: number;
  sx: number;
  sy: number;
  rot: number;
  hwcfg: number;
  moduleType: string;
  revision: string;
  firmware: { major: number; minor: number; patch: number };
  heartbeatType: number;
  activePage: number;
  otherModules: { sx: number; sy: number; hwcfg: number }[];
}

export interface CaptureBurst {
  preSendDelayMs: number;
  n: number;
  timeouts: number;
  nacks: number;
  latencyMs: { min: number; p50: number; max: number };
}

export interface CaptureResults {
  setupBefore: string;
  timerBefore: string;
  setupAfter: string;
  timerAfter: string;
  byteIdentical: boolean;
}

export interface Capture {
  schema: string;
  /** A sibling of `run`, never a field inside it. */
  source: "synthetic" | "hardware";
  capturedAt: string;
  run: CaptureRun;
  identity?: CaptureIdentity;
  events: CaptureEvent[];
  steps: CaptureStep[];
  burst?: CaptureBurst;
  results?: CaptureResults;
}

const toHex = (bytes: Uint8Array | number[]): string =>
  [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

export interface CaptureOptions {
  /**
   * `"hardware"` from the page, `"synthetic"` from the fixture generator.
   * There is no default: a capture that cannot say where it came from is
   * worse than no capture, because plan 05's gate reads exactly this field.
   */
  source: "synthetic" | "hardware";
  /**
   * Defaults to `performance.now()`. Milliseconds WITH the fraction, because
   * `Date.now()` is millisecond-granular and a 9 ms acknowledgement rounds to
   * noise in it. Injected so a generated capture is deterministic.
   */
  now?: () => number;
  /** Pinned by the fixture generator so regeneration is idempotent. */
  capturedAt?: string;
}

export class CaptureRecorder {
  private readonly run: CaptureRun;
  private readonly source: "synthetic" | "hardware";
  private readonly now: () => number;
  private readonly capturedAt: string;
  private readonly events: CaptureEvent[] = [];
  private readonly steps: CaptureStep[] = [];
  private identity: CaptureIdentity | undefined;
  private burst: CaptureBurst | undefined;
  private results: CaptureResults | undefined;
  private n = 0;

  constructor(run: CaptureRun, options: CaptureOptions) {
    this.run = run;
    this.source = options.source;
    this.now = options.now ?? (() => performance.now());
    this.capturedAt = options.capturedAt ?? new Date().toISOString();
  }

  /** Outbound bytes, exactly as handed to the transport - terminator included. */
  tx(bytes: Uint8Array): void {
    this.events.push({
      n: this.n++,
      t: this.now(),
      dir: "tx",
      kind: "bytes",
      hex: toHex(bytes),
    });
  }

  /**
   * One raw chunk from the reader. These are the ONLY events FakeTransport
   * replays: frames alone would make every framing assertion synthetic, and
   * the real chunk boundaries are the thing worth keeping.
   */
  rxChunk(chunk: Uint8Array): void {
    this.events.push({
      n: this.n++,
      t: this.now(),
      dir: "rx",
      kind: "chunk",
      hex: toHex(chunk),
    });
  }

  /**
   * One scanner-emitted frame and what the decoder made of it. A refused frame
   * is recorded with its reason rather than dropped - the package logs those
   * to `console.log`, which is not a record of anything.
   */
  rxFrame(bytes: number[], decoded: DecodedFrame): void {
    const head = {
      n: this.n++,
      t: this.now(),
      dir: "rx",
      kind: "frame",
      hex: toHex(bytes),
    } as const;
    this.events.push(
      decoded.ok
        ? { ...head, ok: true, classes: decoded.classes }
        : { ...head, ok: false, reason: decoded.reason },
    );
  }

  step(step: CaptureStep): void {
    this.steps.push(step);
  }

  setIdentity(identity: CaptureIdentity): void {
    this.identity = identity;
  }

  setResults(results: CaptureResults): void {
    this.results = results;
  }

  setBurst(burst: CaptureBurst): void {
    this.burst = burst;
  }

  toJSON(): Capture {
    return {
      schema: CAPTURE_SCHEMA,
      source: this.source,
      capturedAt: this.capturedAt,
      run: this.run,
      ...(this.identity ? { identity: this.identity } : {}),
      events: this.events,
      steps: this.steps,
      ...(this.burst ? { burst: this.burst } : {}),
      ...(this.results ? { results: this.results } : {}),
    };
  }
}
