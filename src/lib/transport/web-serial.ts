// The real Web Serial transport (FOUND-01, CONN-03, CONN-06).
//
// THIS FILE HAS NO UNIT TEST, and cannot have one: every line of it needs a
// real `SerialPort`, which Vitest's node environment does not have and which
// no polyfill can supply - Web Serial is an operating-system capability, not
// an API shape. Its behaviour is covered by the hardware checklist in plan 04
// and by the no-Web-Serial degrade e2e in plan 03; everything about it that a
// machine CAN check offline lives in transport.ts and is tested there.
//
// Structurally a port of grid-editor/src/renderer/serialport/serial-transport.ts
// (186 lines), with four deliberate changes recorded at their sites: the read
// buffer size, the deleted local port interface, the navigator-level connect
// and disconnect listeners, and the close ordering.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { BAUD_RATE, READ_BUFFER_SIZE, ZONA_USB } from "$lib/protocol";
import type { GridTransport } from "./transport";
// grantedZonaPorts and portIsAttached moved to ./ports, the half of this file
// that needs nothing from the protocol package (06-03). The barrel re-exports
// them from there; this file does not, so there is exactly one path to each.

/**
 * Ask the user for a ZONA and open it.
 *
 * `requestPort()` MUST be the first statement in the click handler that calls
 * this, with nothing awaited before it. The reason is not that the call
 * consumes the user activation - the WICG Serial spec has no consume step -
 * but that transient activation EXPIRES, in about 4.9 seconds in Chromium. An
 * awaited dynamic import on a cold cache can outlast that, so the page loads
 * its modules in `onMount` and the handler awaits nothing before this call.
 *
 * The filter is CONN-07's: the application identity only. The bootloader
 * product id is never listed, so this chooser cannot reach a module in DFU.
 */
export async function openZonaPort(): Promise<SerialPort> {
  const port = await navigator.serial.requestPort({ filters: [ZONA_USB] });
  // MDN's default read buffer is 255 bytes, and a factory Setup config comes
  // back as a 690-byte REPORT; without this it arrives as three chunks and
  // every framing assertion measures the buffer rather than the wire.
  await port.open({ baudRate: BAUD_RATE, bufferSize: READ_BUFFER_SIZE });
  return port;
}

export class WebSerialTransport implements GridTransport {
  private readonly port: SerialPort;
  private reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  /** Resolves when the read loop has actually exited. Owns the close ordering. */
  private readerDone: Promise<void> | undefined;
  private dataCb: ((chunk: Uint8Array) => void) | undefined;
  private closeCb: ((reason: string) => void) | undefined;
  private opened = true;
  /** Fired when a permitted ZONA is physically plugged in while the page is open. */
  onDeviceAppeared: ((port: SerialPort) => void) | undefined;

  constructor(port: SerialPort) {
    this.port = port;
    this.port.addEventListener("disconnect", this.handleDisconnect);
    // The gap in the desktop transport: it attaches `disconnect` to the PORT
    // and never listens for `connect` at all, so it can only notice a device
    // leaving, never one arriving. Both belong on `navigator.serial`.
    navigator.serial.addEventListener("connect", this.handleSerialConnect);
    navigator.serial.addEventListener("disconnect", this.handleDisconnect);
  }

  get isOpen(): boolean {
    return this.opened;
  }

  async write(data: Uint8Array): Promise<void> {
    // Kept verbatim from the desktop (serial-transport.ts:97-112) because it is
    // correct: both guards, then a writer released in a `finally`. The wording
    // matters - Phase 7's retry policy classifies by message text.
    if (!this.port.writable) {
      throw new Error(
        "The port is not writable; the write was interrupted (the ZONA was probably unplugged)",
      );
    }
    if (this.port.writable.locked) {
      throw new Error("The port is busy: another write is still in flight");
    }
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  onData(cb: (chunk: Uint8Array) => void): void {
    this.dataCb = cb;
    // The read loop starts only once there is somewhere to put the bytes
    // (serial-transport.ts:114-120), which is what stops the first chunk after
    // open being read and dropped.
    if (this.opened && !this.readerDone) this.readerDone = this.readLoop();
  }

  onClose(cb: (reason: string) => void): void {
    this.closeCb = cb;
  }

  async close(): Promise<void> {
    // The desktop releases the lock inside close() while the read loop's own
    // `finally` also releases it (serial-transport.ts:63-84 and :175-184); the
    // second release throws and is swallowed by a console.warn. Own the
    // ordering instead: cancel, wait for the loop to exit, release once, close.
    this.opened = false;
    this.detach();
    await this.reader?.cancel().catch(() => {});
    await this.readerDone;
    this.readerDone = undefined;
    try {
      this.reader?.releaseLock();
    } finally {
      this.reader = undefined;
    }
    await this.port.close();
  }

  /**
   * PITFALLS C1, symmetric: while this page holds the port, Grid Editor cannot
   * open it, and the user's next Editor session fails for a reason they will
   * never connect to a browser tab they closed. The page calls this on
   * `pagehide` - not `beforeunload`, which a bfcache restore skips.
   */
  closeOnHide(): () => void {
    const onHide = () => {
      void this.close().catch(() => {});
    };
    addEventListener("pagehide", onHide);
    return () => removeEventListener("pagehide", onHide);
  }

  private detach(): void {
    this.port.removeEventListener("disconnect", this.handleDisconnect);
    navigator.serial.removeEventListener("connect", this.handleSerialConnect);
    navigator.serial.removeEventListener("disconnect", this.handleDisconnect);
  }

  private handleSerialConnect = (ev: Event): void => {
    // The listener parameter is a plain Event on both Serial and SerialPort,
    // so the port has to be cast out of the target.
    const port = ev.target as SerialPort | null;
    if (port) this.onDeviceAppeared?.(port);
  };

  private handleDisconnect = (ev: Event): void => {
    // navigator.serial fires for every permitted device; only ours counts.
    if (ev.target !== this.port && ev.currentTarget !== this.port) {
      if (ev.target !== navigator.serial && ev.target !== null) return;
    }
    if (!this.opened) return;
    this.opened = false;
    this.detach();
    this.closeCb?.("The ZONA was unplugged");
  };

  private async readLoop(): Promise<void> {
    const readable = this.port.readable;
    if (!readable) return;
    this.reader = readable.getReader();
    try {
      for (;;) {
        const { done, value } = await this.reader.read();
        if (done) break;
        if (value && this.dataCb) this.dataCb(value);
      }
    } catch (err) {
      if (this.opened) {
        this.opened = false;
        this.closeCb?.(
          `Reading from the ZONA was interrupted (${err instanceof Error ? err.message : String(err)})`,
        );
      }
    }
    // No releaseLock() here on purpose: close() owns it, exactly once.
  }
}
