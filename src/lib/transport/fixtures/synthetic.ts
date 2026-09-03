// Inbound frames a real ZONA would send, built from real encoder output.
//
// This is the ONLY file outside src/lib/protocol/descriptors.ts allowed to call
// encode_packet, and the only one allowed to name the page-report class.
// forbidden-instructions.spec.ts excludes `fixtures/` from both rules, for the
// same reason: everything here is a frame HANGAR RECEIVES. The forbidden thing
// is the EXECUTE form of a page change, which no file may construct - and none
// does, here or anywhere.
//
// Two facts shape every builder below, both executed against the pinned
// package rather than assumed:
//
//   1. encode_packet emits exactly ONE class block (dist/index.js:3925-3998).
//      A USB-attached module's heartbeat carries TWO - the heartbeat and the
//      active page beside it (grid_transport.c:199-203) - so that frame is
//      spliced by hand and its BRC LEN and checksum are rewritten.
//   2. encode_packet forces SX and SY to zero on the wire, and the decoder
//      subtracts 127 from both, so an encoder-built frame decodes as SX -127.
//      A directly attached module reports SX 0. The address bytes are rewritten
//      here for exactly that reason.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { grid } from "@intechstudio/grid-protocol";
import {
  ELEMENT_TOUCH,
  PROTOCOL_VERSION,
  type DecodedClass,
} from "$lib/protocol";

const STX = 2;
const ETX = 3;
const EOT = 4;

/**
 * The class name on the second block of a USB-attached module's heartbeat. It
 * is a REPORT - something the module tells the host - and it is the only form
 * of this class that appears anywhere in HANGAR. The EXECUTE form destroys the
 * module's Lua VM and is forbidden forever (D-06).
 */
const PAGE_REPORT = "PAGEACTIVE";

interface BrcField {
  length: string;
  offset: string;
}
// Both values are STRINGS on the pinned package - `{ "length": "4",
// "offset": "2" }`. Left uncoerced, `offset + length` is "24" and the write
// loop runs 22 characters across the rest of the header instead of 4.
const BRC = grid.getProperty("BRC") as Record<string, BrcField>;
const field = (name: string) => ({
  offset: Number(BRC[name].offset),
  length: Number(BRC[name].length),
});

interface Encoded {
  serial: number[];
  id: number;
}

function encodeOne(descr: {
  brc_parameters: Record<string, number>;
  class_name: string;
  class_instr: string;
  class_parameters: Record<string, number | string>;
}): number[] {
  const encoded = grid.encode_packet(descr) as Encoded | undefined;
  if (!encoded) {
    throw new Error(`encode_packet returned undefined for ${descr.class_name}`);
  }
  return [...encoded.serial];
}

/** A message is the frame without its two checksum characters. */
const message = (serial: number[]) => serial.slice(0, -2);

/** Zero-padded lowercase hex, in place, exactly as encode_packet wrote it. */
function writeField(msg: number[], name: string, value: number): void {
  const { offset, length } = field(name);
  const hex = value.toString(16).padStart(length, "0");
  for (let i = 0; i < length; i++) msg[offset + i] = hex.charCodeAt(i);
}

/**
 * Rewrite BRC LEN and append the checksum.
 *
 * decode_packet_frame requires `array.length - 2 === LEN` (dist/index.js:
 * 4045-4048), so LEN is the message length EXCLUDING the two checksum
 * characters - which is exactly `msg.length` at this point. Checksum is the XOR
 * of every byte before it, as two lowercase hex characters (:3987-3993).
 */
function seal(msg: number[]): number[] {
  writeField(msg, "LEN", msg.length);
  const checksum = msg
    .reduce((a, b) => a ^ b)
    .toString(16)
    .padStart(2, "0");
  return [...msg, checksum.charCodeAt(0), checksum.charCodeAt(1)];
}

/**
 * Cut the second message's class block out from its STX through its ETX
 * inclusive and insert it immediately before the first message's EOT.
 */
function spliceClass(msg: number[], other: number[]): number[] {
  const stxIndex = other.indexOf(STX);
  const etxIndex = other.indexOf(ETX, stxIndex);
  if (stxIndex < 0 || etxIndex < 0) throw new Error("no class block to splice");
  const block = other.slice(stxIndex, etxIndex + 1);
  const eotIndex = msg.length - 1;
  if (msg[eotIndex] !== EOT) throw new Error("message does not end with EOT");
  return [...msg.slice(0, eotIndex), ...block, ...msg.slice(eotIndex)];
}

/** Encode, then rewrite the source address to the module's own. */
function inbound(
  descr: Parameters<typeof encodeOne>[0],
  from: { sx: number; sy: number },
): number[] {
  const msg = message(encodeOne(descr));
  writeField(msg, "SX", from.sx + 127);
  writeField(msg, "SY", from.sy + 127);
  return msg;
}

/** A module addresses the host globally, the way firmware does. */
const GLOBAL = { DX: -127, DY: -127 };

export interface Firmware {
  major: number;
  minor: number;
  patch: number;
}

export function heartbeatFrame(opts: {
  sx: number;
  sy: number;
  type: number;
  hwcfg: number;
  activePage: number;
  firmware: Firmware;
}): number[] {
  const msg = inbound(
    {
      brc_parameters: GLOBAL,
      class_name: "HEARTBEAT",
      class_instr: "EXECUTE",
      class_parameters: {
        TYPE: opts.type,
        HWCFG: opts.hwcfg,
        VMAJOR: opts.firmware.major,
        VMINOR: opts.firmware.minor,
        VPATCH: opts.firmware.patch,
        PORTSTATE: 0,
      },
    },
    opts,
  );
  // TYPE 0 is a chained module and carries one class. TYPE 1 is the
  // USB-attached one, and firmware appends the active page to the same frame.
  if (opts.type !== 1) return seal(msg);
  const pageReport = encodeOne({
    brc_parameters: GLOBAL,
    class_name: PAGE_REPORT,
    class_instr: "REPORT",
    class_parameters: { PAGENUMBER: opts.activePage },
  });
  return seal(spliceClass(msg, pageReport));
}

export function configReportFrame(opts: {
  sx: number;
  sy: number;
  page: number;
  event: number;
  config: string;
}): number[] {
  return seal(
    inbound(
      {
        brc_parameters: GLOBAL,
        class_name: "CONFIG",
        class_instr: "REPORT",
        class_parameters: {
          VERSIONMAJOR: PROTOCOL_VERSION.MAJOR,
          VERSIONMINOR: PROTOCOL_VERSION.MINOR,
          VERSIONPATCH: PROTOCOL_VERSION.PATCH,
          PAGENUMBER: opts.page,
          ELEMENTNUMBER: ELEMENT_TOUCH,
          EVENTTYPE: opts.event,
          ACTIONLENGTH: opts.config.length,
          ACTIONSTRING: opts.config,
        },
      },
      opts,
    ),
  );
}

/**
 * A six-byte class block. Every config field on it decodes as `undefined`,
 * which is why an acknowledgement filter names no class parameters and
 * correlates on LASTHEADER instead.
 */
export function configAckFrame(opts: {
  sx: number;
  sy: number;
  lastheader: number;
}): number[] {
  return seal(
    inbound(
      {
        brc_parameters: GLOBAL,
        class_name: "CONFIG",
        class_instr: "ACKNOWLEDGE",
        class_parameters: { LASTHEADER: opts.lastheader },
      },
      opts,
    ),
  );
}

export function configNackFrame(opts: {
  sx: number;
  sy: number;
  lastheader: number;
}): number[] {
  return seal(
    inbound(
      {
        brc_parameters: GLOBAL,
        class_name: "CONFIG",
        class_instr: "NACKNOWLEDGE",
        class_parameters: { LASTHEADER: opts.lastheader },
      },
      opts,
    ),
  );
}

export function pagestoreAckFrame(opts: { lastheader: number }): number[] {
  return seal(
    inbound(
      {
        brc_parameters: GLOBAL,
        class_name: "PAGESTORE",
        class_instr: "ACKNOWLEDGE",
        class_parameters: { LASTHEADER: opts.lastheader },
      },
      // The store is a global broadcast and so is its acknowledgement; the
      // address is the module's own only because it has to be something.
      { sx: 0, sy: 0 },
    ),
  );
}

export interface ZonaState {
  sx: number;
  sy: number;
  activePage: number;
  configs: Record<number, string>;
}

/** The scripted ZONA a live FakeTransport answers with. */
export function zonaResponder(
  state: ZonaState,
): (outbound: DecodedClass, requestId: number) => number[][] {
  return (outbound, requestId) => {
    const { class_name, class_instr, class_parameters } = outbound;
    const event = Number(class_parameters.EVENTTYPE);
    const page = Number(class_parameters.PAGENUMBER);

    if (class_name === "CONFIG" && class_instr === "FETCH") {
      // Firmware answers a fetch of a page that is not active with an empty
      // string rather than an error (grid_ui.c:464-501), which is exactly the
      // shape D-09's write refusal exists to catch.
      const config =
        page === state.activePage ? (state.configs[event] ?? "") : "";
      return [
        configReportFrame({ sx: state.sx, sy: state.sy, page, event, config }),
      ];
    }
    if (class_name === "CONFIG" && class_instr === "EXECUTE") {
      state.configs[event] = String(class_parameters.ACTIONSTRING ?? "");
      return [
        configAckFrame({ sx: state.sx, sy: state.sy, lastheader: requestId }),
      ];
    }
    if (class_name === "PAGESTORE" && class_instr === "EXECUTE") {
      return [pagestoreAckFrame({ lastheader: requestId })];
    }
    // A host heartbeat is answered by nothing at all. Firmware records it and
    // re-enables page changes; it never replies.
    return [];
  };
}
