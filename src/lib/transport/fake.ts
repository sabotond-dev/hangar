// FakeTransport: a ZONA that is not there (FOUND-01, D-07).
//
// Two modes, one class:
//
//   REPLAY - reads ONLY `events[].dir === "rx" && kind === "chunk"` from a
//   capture and hands those bytes back at their recorded boundaries. The
//   `frame` and `classes` entries are for assertions, never for replay; using
//   the chunks is what makes the framing tests exercise real chunk splits
//   instead of a tidy one-frame-per-callback fiction.
//
//   LIVE - decodes each outbound frame, asks a responder what the module would
//   say, and feeds the answer back as rx chunks. The request id is read off the
//   wire from the frame's own BRC header, so "the acknowledgement echoes the
//   request id" is a genuine round trip rather than a value handed to the fake.
//
// Five faults, one per failure the queue has to survive. Every one of them
// changes exactly the behaviour it names and nothing else.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { TERMINATOR, type DecodedClass, decodeFrame } from "$lib/protocol";
import type { Capture } from "./capture";
import type { GridTransport } from "./transport";

export type Fault =
  | { kind: "drop"; match: ClassMatch; nth?: number }
  | { kind: "delay"; match: ClassMatch; byMs: number }
  | { kind: "disconnect"; afterTxFrames: number }
  | { kind: "corrupt"; match: { class_name: string }; nth?: number }
  | { kind: "truncate"; afterRxBytes: number };

export interface ClassMatch {
  class_name: string;
  class_instr: string;
}

export interface FakeOptions {
  responder?: (outbound: DecodedClass, requestId: number) => number[][];
  faults?: Fault[];
  /** How a response frame is broken into rx chunks, so the scanner is exercised too. */
  chunking?: "whole" | number;
}

const fromHex = (hex: string): number[] => {
  const out: number[] = [];
  for (let i = 0; i < hex.length; i += 2)
    out.push(parseInt(hex.slice(i, i + 2), 16));
  return out;
};

export class FakeTransport implements GridTransport {
  /** Every Uint8Array passed to write(), in order. The retry bound reads this. */
  readonly writes: Uint8Array[] = [];

  private readonly responder: FakeOptions["responder"];
  private readonly faults: Fault[];
  private readonly chunking: "whole" | number;
  private dataCb: ((chunk: Uint8Array) => void) | undefined;
  private closeCb: ((reason: string) => void) | undefined;
  private opened = true;
  private rxBytes = 0;
  private readonly hits = new Map<Fault, number>();
  private readonly timers: ReturnType<typeof setTimeout>[] = [];
  private replay: { bytes: number[]; t: number }[] | undefined;
  private speed: "instant" | "realtime" = "instant";

  constructor(opts: FakeOptions = {}) {
    this.responder = opts.responder;
    this.faults = opts.faults ?? [];
    this.chunking = opts.chunking ?? "whole";
  }

  static fromCapture(
    capture: Capture,
    opts?: { speed?: "instant" | "realtime" },
  ): FakeTransport {
    const fake = new FakeTransport();
    fake.replay = capture.events
      .filter((e) => e.dir === "rx" && e.kind === "chunk")
      .map((e) => ({ bytes: fromHex(e.hex), t: e.t }));
    fake.speed = opts?.speed ?? "instant";
    return fake;
  }

  get isOpen(): boolean {
    return this.opened;
  }

  async write(data: Uint8Array): Promise<void> {
    if (!this.opened) {
      throw new Error("The port is closed; the write was interrupted");
    }
    this.writes.push(data);

    const disconnect = this.faults.find((f) => f.kind === "disconnect");
    if (disconnect && this.writes.length >= disconnect.afterTxFrames) {
      this.fail("The ZONA was unplugged mid-write");
      return;
    }
    if (!this.responder) return;

    // The scanner emits frames without their terminator, so the decoder is
    // given the same shape here.
    const frame = [...data];
    if (frame[frame.length - 1] === TERMINATOR) frame.pop();
    const decoded = decodeFrame(frame);
    if (!decoded.ok) return;
    const requestId = Number(decoded.classes[0]?.brc_parameters.ID ?? 0);
    for (const cls of decoded.classes) {
      for (const reply of this.responder(cls, requestId)) this.respond(reply);
    }
  }

  onData(cb: (chunk: Uint8Array) => void): void {
    this.dataCb = cb;
    // Like the real transport, nothing is delivered before there is somewhere
    // to put it.
    if (!this.replay) return;
    const chunks = this.replay;
    this.replay = undefined;
    if (this.speed === "instant") {
      for (const chunk of chunks) this.emit(chunk.bytes);
      return;
    }
    const base = chunks[0]?.t ?? 0;
    for (const chunk of chunks) {
      this.timers.push(
        setTimeout(() => this.emit(chunk.bytes), Math.max(0, chunk.t - base)),
      );
    }
  }

  onClose(cb: (reason: string) => void): void {
    this.closeCb = cb;
  }

  async close(): Promise<void> {
    this.opened = false;
    this.clearTimers();
  }

  private respond(frame: number[]): void {
    const decoded = decodeFrame(frame);
    const classes = decoded.ok ? decoded.classes : [];
    if (this.dropped(classes)) return;

    let bytes = [...frame];
    if (this.corrupted(classes)) {
      // Flip one checksum character. decode_packet_frame then returns
      // undefined - it never returns a wrong answer - so the frame arrives on
      // the wire and dies at the decoder, which is the real failure shape.
      const last = bytes.length - 1;
      bytes = [...bytes.slice(0, last), bytes[last] === 48 ? 49 : 48];
    }
    const send = () => this.emit([...bytes, TERMINATOR]);
    const delay = this.delayed(classes);
    if (delay === undefined) send();
    else this.timers.push(setTimeout(send, delay));
  }

  private emit(bytes: number[]): void {
    if (!this.opened || !this.dataCb) return;
    let out = bytes;
    const truncate = this.faults.find((f) => f.kind === "truncate");
    if (truncate) {
      const room = truncate.afterRxBytes - this.rxBytes;
      if (room <= 0) return;
      if (out.length > room) out = out.slice(0, room);
    }
    this.rxBytes += out.length;
    if (this.chunking === "whole") {
      this.dataCb(Uint8Array.from(out));
      return;
    }
    for (let i = 0; i < out.length; i += this.chunking) {
      this.dataCb(Uint8Array.from(out.slice(i, i + this.chunking)));
    }
  }

  private fail(reason: string): void {
    if (!this.opened) return;
    this.opened = false;
    this.clearTimers();
    this.closeCb?.(reason);
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.length = 0;
  }

  /** True on the nth matching occurrence, or on every one when nth is absent. */
  private due(
    fault: Fault,
    matched: boolean,
    nth: number | undefined,
  ): boolean {
    if (!matched) return false;
    const n = (this.hits.get(fault) ?? 0) + 1;
    this.hits.set(fault, n);
    return nth === undefined || nth === n;
  }

  private hit(classes: DecodedClass[], match: Partial<ClassMatch>): boolean {
    return classes.some(
      (c) =>
        c.class_name === match.class_name &&
        (match.class_instr === undefined ||
          c.class_instr === match.class_instr),
    );
  }

  private dropped(classes: DecodedClass[]): boolean {
    for (const fault of this.faults) {
      if (fault.kind !== "drop") continue;
      if (this.due(fault, this.hit(classes, fault.match), fault.nth))
        return true;
    }
    return false;
  }

  private corrupted(classes: DecodedClass[]): boolean {
    for (const fault of this.faults) {
      if (fault.kind !== "corrupt") continue;
      if (this.due(fault, this.hit(classes, fault.match), fault.nth))
        return true;
    }
    return false;
  }

  private delayed(classes: DecodedClass[]): number | undefined {
    for (const fault of this.faults) {
      if (fault.kind !== "delay") continue;
      if (this.due(fault, this.hit(classes, fault.match), undefined)) {
        return fault.byMs;
      }
    }
    return undefined;
  }
}
