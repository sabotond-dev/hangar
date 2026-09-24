// The inbound decode guard (FOUND-01).
//
// One rule, and the whole module exists to hold it: the frame decoder's result
// is checked for truthiness, and it is checked BEFORE the class decoder runs.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { grid } from "@intechstudio/grid-protocol";

export interface DecodedClass {
  class_name: string;
  class_instr: string;
  class_parameters: Record<string, number | string | undefined>;
  brc_parameters: Record<string, number>;
  /**
   * The class block between its STX and its ETX, exactly as the package's
   * frame decoder cut it (change 20). The class table decodes a fixed field
   * set; LEDPREVIEW carries a RUN of eight-character records after its
   * LENGTH and the table names only the first, so the run is read off these
   * bytes (preview.ts), where grid-editor reads it too
   * (message-stream.store.ts:164-184). Optional: a class built by hand in a
   * test or a fixture need not carry it.
   */
  raw?: readonly number[];
}

export type DecodedFrame =
  | { ok: true; classes: DecodedClass[] }
  | { ok: false; reason: string };

/**
 * Decode one scanner-emitted frame into every class it carries.
 *
 * A single BRC frame routinely carries more than one class - a heartbeat
 * carries the module's active page beside it, a store acknowledgement carries a
 * debug text - so the whole list is returned and the leading class is never
 * taken on its own.
 */
export function decodeFrame(bytes: number[]): DecodedFrame {
  const frame = grid.decode_packet_frame(bytes);
  // decode_packet_frame returns UNDEFINED at all seven of its failure exits
  // (dist/index.js:4018, 4023, 4028, 4034, 4048, 4053, 4076), so the desktop's
  // inequality guard at serialport.ts:173 is dead code and its
  // decode_packet_classes-before-check ordering at :170-172 is a real,
  // reachable bug. Check truthiness, and check it FIRST.
  if (!frame) {
    return { ok: false, reason: "decode_packet_frame returned undefined" };
  }
  grid.decode_packet_classes(frame);
  const classes = (frame as DecodedClass[]).map((cls) => ({
    class_name: cls.class_name,
    class_instr: cls.class_instr,
    class_parameters: cls.class_parameters,
    // Every class in a frame shares one decoded BRC header.
    brc_parameters: cls.brc_parameters,
    raw: (cls as { raw?: number[] }).raw,
  }));
  return { ok: true, classes };
}
