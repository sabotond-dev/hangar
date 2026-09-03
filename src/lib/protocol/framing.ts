// The rx frame scanner: EOT + LF, with a cursor and a ceiling (FOUND-01).
//
// Shape from grid-editor/src/renderer/serialport/serialport.ts:143-185. Two
// deliberate differences: a cursor, so a long partial frame is not rescanned
// from zero on every chunk, and an 8 KB ceiling, so a link that never produces
// a delimiter cannot grow the buffer without bound.
//
// Known limitation, shared with the desktop and worth writing down: the
// delimiter is not escape-safe. A byte 4 three positions before a byte 10
// INSIDE a config string would split a frame early; both halves then fail their
// checksum and are dropped. Minified Lua is printable ASCII, which is why
// descriptors.ts asserts that before a write - and why the torn-frame test
// below exists.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
export const EOT = 4;
export const TERMINATOR = 10;
/** About eight maximum-size frames. Anything larger is not a frame. */
export const MAX_BUFFER = 8192;

export class FrameScanner {
  private buf: number[] = [];
  private scanned = 0;
  /** Fired when the ceiling is hit and the buffer is dropped. */
  onOverflow: (() => void) | undefined;

  get buffered(): number {
    return this.buf.length;
  }

  push(chunk: Uint8Array | number[]): number[][] {
    for (const b of chunk) this.buf.push(b);
    const out: number[][] = [];
    let start = 0;
    // i-3 needs three bytes of lookback, so the scan never starts below 3.
    for (let i = Math.max(this.scanned, 3); i < this.buf.length; i++) {
      if (this.buf[i] === TERMINATOR && this.buf[i - 3] === EOT) {
        // The frame EXCLUDES the terminator and INCLUDES the two checksum
        // characters - exactly what decode_packet_frame expects
        // (dist/index.js:4030-4034 requires array[length-3] === EOT).
        out.push(this.buf.slice(start, i));
        start = i + 1;
      }
    }
    this.buf = this.buf.slice(start);
    this.scanned = start > 0 ? 0 : this.buf.length;
    if (this.buf.length > MAX_BUFFER) {
      this.buf = [];
      this.scanned = 0;
      this.onOverflow?.();
    }
    return out;
  }
}
