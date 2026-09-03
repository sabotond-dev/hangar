// The four outbound instructions HANGAR is allowed to send (FOUND-01, D-06).
//
// Parameter names are copied verbatim from grid-editor's
// src/renderer/serialport/instructions.ts - SendHeartbeatImmediate :28-64,
// FetchConfig :66-116, SendConfig :118-178, StorePage :341-370. Those names are
// generated from firmware tables, so a paraphrase is a silent fork.
//
// This is the ONLY shipped module that encodes a packet; everything else under
// src/lib/protocol/ is decoding or policy, and forbidden-instructions.spec.ts
// proves both that and the D-06 exclusions structurally.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { grid } from "@intechstudio/grid-protocol";
import {
  CONFIG_MAX,
  ELEMENT_TOUCH,
  PRINTABLE_ASCII,
  PROTOCOL_VERSION,
  TIMEOUTS,
} from "./constants";

export interface GridDescriptor {
  brc_parameters: Record<string, number>;
  class_name: string;
  class_instr: string;
  class_parameters: Record<string, number | string>;
}

export interface ResponseFilter {
  brc_parameters?: Record<string, number>;
  class_name: string;
  class_instr: string;
  class_parameters?: Record<string, number>;
}

export interface GridRequest {
  /** Stable id used in the capture's steps[] and in the page's status list. */
  label: string;
  descr: GridDescriptor;
  /** Absent for a fire-and-forget send (the heartbeat). */
  filter?: ResponseFilter;
  timeoutMs?: number;
  /**
   * True only where firmware echoes the request BRC id into LASTHEADER:
   * CONFIG and PAGESTORE ACKNOWLEDGE / NACKNOWLEDGE (grid_decode.c:1307, :947).
   * NEVER true for a REPORT - offset 5 is VERSIONMAJOR there.
   */
  correlateById: boolean;
}

/** The version triple HANGAR announces as a host. Firmware ignores it. */
export interface HostVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * The host heartbeat, addressed globally.
 *
 * TYPE 255 is the only value HANGAR ever sends. It is also the only thing that
 * re-enables page changes on a module after a config write (grid_decode.c:717),
 * which is why every run ends with one of these. The desktop can send a second
 * value from the same field; HANGAR cannot, and no code path here can build it.
 */
export function hostHeartbeat(
  version: HostVersion = { major: 1, minor: 0, patch: 0 },
): GridRequest {
  return {
    label: "heartbeat",
    descr: {
      brc_parameters: { DX: -127, DY: -127 },
      class_name: "HEARTBEAT",
      class_instr: "EXECUTE",
      class_parameters: {
        TYPE: 255,
        HWCFG: 255,
        VMAJOR: version.major,
        VMINOR: version.minor,
        VPATCH: version.patch,
      },
    },
    correlateById: false,
  };
}

/**
 * Read one event's config string back from the module.
 *
 * Addressed to the module's own SX/SY, so the REPORT filter names the same
 * address as its source. The desktop's `LASTHEADER: null` filter placeholder is
 * deliberately dropped: it existed only so sendToGrid could overwrite it for
 * NACK matching, and the positive-match loop skipped it (engine.store.ts:419).
 * HANGAR carries the id in GridRequest.correlateById instead.
 */
export function fetchConfig(
  sx: number,
  sy: number,
  page: number,
  event: number,
): GridRequest {
  return {
    label: `fetch-${event}`,
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "CONFIG",
      class_instr: "FETCH",
      class_parameters: {
        VERSIONMAJOR: PROTOCOL_VERSION.MAJOR,
        VERSIONMINOR: PROTOCOL_VERSION.MINOR,
        VERSIONPATCH: PROTOCOL_VERSION.PATCH,
        PAGENUMBER: page,
        ELEMENTNUMBER: ELEMENT_TOUCH,
        EVENTTYPE: event,
        ACTIONLENGTH: 0,
      },
    },
    filter: {
      brc_parameters: { SX: sx, SY: sy },
      class_name: "CONFIG",
      class_instr: "REPORT",
      class_parameters: {
        PAGENUMBER: page,
        ELEMENTNUMBER: ELEMENT_TOUCH,
        EVENTTYPE: event,
      },
    },
    timeoutMs: TIMEOUTS.fetchMs,
    correlateById: false,
  };
}

/**
 * Write one event's config string into the module's RAM.
 *
 * The acknowledgement is a six-byte class block, so every config field on it
 * decodes as undefined - the filter therefore names no class parameters and
 * correlates on the id firmware echoes instead.
 */
export function sendConfig(
  sx: number,
  sy: number,
  page: number,
  event: number,
  config: string,
): GridRequest {
  // The last pure point before the wire. Both refusals are D-09's, and the
  // length rule is the desktop's own (instructions.ts:166).
  if (config.length >= CONFIG_MAX) {
    throw new RangeError(
      `Config is ${config.length} characters; the module's limit is ${CONFIG_MAX}`,
    );
  }
  if (!PRINTABLE_ASCII.test(config)) {
    const i = [...config].findIndex((ch) => !PRINTABLE_ASCII.test(ch));
    throw new RangeError(
      `Config has a non-printable character at index ${i}; encode_packet writes one byte per character`,
    );
  }
  return {
    label: `write-${event}`,
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "CONFIG",
      class_instr: "EXECUTE",
      class_parameters: {
        VERSIONMAJOR: PROTOCOL_VERSION.MAJOR,
        VERSIONMINOR: PROTOCOL_VERSION.MINOR,
        VERSIONPATCH: PROTOCOL_VERSION.PATCH,
        PAGENUMBER: page,
        ELEMENTNUMBER: ELEMENT_TOUCH,
        EVENTTYPE: event,
        // Computed from the same identifier in the same object literal so the
        // two cannot drift: firmware checks script[ACTIONLENGTH] === ETX and
        // NACKs with no other diagnostic when they disagree.
        ACTIONLENGTH: config.length,
        ACTIONSTRING: config,
      },
    },
    filter: {
      brc_parameters: { SX: sx, SY: sy },
      class_name: "CONFIG",
      class_instr: "ACKNOWLEDGE",
    },
    timeoutMs: TIMEOUTS.executeMs,
    correlateById: true,
  };
}

/**
 * Commit the module's RAM config to flash.
 *
 * The page stored is the module's own active page and is never a parameter
 * (grid_decode.c:976). The instruction is a global broadcast and so is its
 * acknowledgement, which is why the filter names no address at all - and why
 * D-12 disables this button when a second module is on the bus.
 */
export function storePage(): GridRequest {
  return {
    label: "store",
    descr: {
      brc_parameters: { DX: -127, DY: -127 },
      class_name: "PAGESTORE",
      class_instr: "EXECUTE",
      class_parameters: {},
    },
    filter: { class_name: "PAGESTORE", class_instr: "ACKNOWLEDGE" },
    timeoutMs: TIMEOUTS.pagestoreMs,
    correlateById: true,
  };
}

/**
 * Encode a request to the bytes that go on the wire, and return the BRC id the
 * acknowledgement will echo back. The id is a module-level counter inside the
 * protocol package, cycling 1..255; it exists only on the return value, so it
 * must be captured here rather than read back off the descriptor.
 */
export function encodeRequest(req: GridRequest): {
  bytes: Uint8Array;
  id: number;
} {
  const encoded = grid.encode_packet(req.descr);
  if (!encoded) {
    throw new Error(`encode_packet returned undefined for ${req.label}`);
  }
  // encode_packet stops at the checksum; the caller pushes the terminator
  // (engine.store.ts:250 does exactly this).
  const serial = [...(encoded.serial as number[]), 10];
  return { bytes: Uint8Array.from(serial), id: encoded.id as number };
}
