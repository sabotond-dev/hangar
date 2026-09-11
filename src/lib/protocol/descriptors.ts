// The outbound instructions HANGAR is allowed to send (FOUND-01, D-06; Phase
// 13 D-06 and D-19).
//
// Four of them are the walking skeleton's. The fifth, fetchSerialNumber, was
// added by Phase 7 (07-CONTEXT D-04 amended) because the durable snapshot
// behind PUT BACK needs a key that names one module and survives a closed tab,
// and the browser refuses to expose the USB serial it keys its own grant on.
// Phase 2 closed the set at five and forbade the page-change class by name.
//
// THREE MORE SINCE PHASE 13, PLAN 13-12, AND THE OLD RULE THAT FORBADE THEM
// IS SUPERSEDED BY NAME. 13-CONTEXT D-06: the page target switches the
// hardware page, and D-19: HANGAR can do anything the Editor can. So
// pageActive (PAGEACTIVE/EXECUTE - the switch), fetchPageCount
// (PAGECOUNT/FETCH - the enumeration, never a hard-coded four) and
// discardPage (PAGEDISCARD/EXECUTE - reload the active page from flash, the
// firmware-native revert, UNPROVEN on hardware) join the five. The set is
// closed at eight; forbidden-instructions.spec.ts test 4 counts them, and
// its tests 1 and 2 were amended in the same plan to forbid what is still
// forbidden - the NVM erase and the page clear - rather than what D-06 asked
// for. Nothing about the envelope those three arrive in lives here: the
// click, the review, the ACK gate and the per-page snapshot are
// src/lib/device/page-target.ts's and install.svelte.ts's.
//
// Parameter names are copied verbatim from grid-editor's
// src/renderer/serialport/instructions.ts - SendHeartbeatImmediate :28-64,
// FetchConfig :66-116, SendConfig :118-178, StorePage :341-370. Those names are
// generated from firmware tables, so a paraphrase is a silent fork. The desktop
// never sends a serial-number fetch, so that one's names (WORD0..WORD3) come
// from the pinned package's own tables and grid_protocol.h:952-965. The three
// page classes' names (PAGENUMBER, LASTHEADER) are read the same way, from
// the pinned package's class table, and each builder below cites the offset.
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
import type { DecodedClass } from "./decode";

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
 *
 * `element` IS THE LAST PARAMETER AND DEFAULTS TO THE TOUCH ELEMENT (Phase 12,
 * plan 02). Trailing rather than beside `event` for one reason and it is the
 * same reason in both functions: sendConfig's `config` already sits after
 * `event`, so an element inserted there would silently retarget every existing
 * five-argument call at a config string coerced to a number. One rule for both
 * keeps a reader from having to remember which is which.
 *
 * It goes into the descriptor AND into the response filter. The filter is the
 * half that matters: firmware maps 255 back to 255 on the REPORT
 * (grid_decode.c:1337-1338), so a filter that always named the touch element
 * would let a system fetch time out while its answer sat in the queue.
 */
export function fetchConfig(
  sx: number,
  sy: number,
  page: number,
  event: number,
  element: number = ELEMENT_TOUCH,
): GridRequest {
  return {
    label: `fetch-${element}-${event}`,
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "CONFIG",
      class_instr: "FETCH",
      class_parameters: {
        VERSIONMAJOR: PROTOCOL_VERSION.MAJOR,
        VERSIONMINOR: PROTOCOL_VERSION.MINOR,
        VERSIONPATCH: PROTOCOL_VERSION.PATCH,
        PAGENUMBER: page,
        ELEMENTNUMBER: element,
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
        ELEMENTNUMBER: element,
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
 *
 * `element` is the LAST parameter and defaults to the touch element, for the
 * reason written above fetchConfig. Firmware's budget is the same
 * `scriptlength <= 909` for every element (grid_decode.c:1272), so the two
 * refusals below are unchanged by it.
 */
export function sendConfig(
  sx: number,
  sy: number,
  page: number,
  event: number,
  config: string,
  element: number = ELEMENT_TOUCH,
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
    label: `write-${element}-${event}`,
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "CONFIG",
      class_instr: "EXECUTE",
      class_parameters: {
        VERSIONMAJOR: PROTOCOL_VERSION.MAJOR,
        VERSIONMINOR: PROTOCOL_VERSION.MINOR,
        VERSIONPATCH: PROTOCOL_VERSION.PATCH,
        PAGENUMBER: page,
        ELEMENTNUMBER: element,
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
 * acknowledgement, which is why the filter names no address at all. Phase 2's
 * D-12 disabled the store when a second module was on the bus; SAFE-06
 * (07-CONTEXT D-05) supersedes that rule: the store stays allowed on a rig, and
 * the confirmation names the other modules and says their current pages are
 * stored too, because every module on the bus answers this broadcast.
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
 * Ask the module for its factory serial number (07-CONTEXT D-04 amended).
 *
 * ADDRESSED, NEVER BROADCAST. Firmware accepts this FETCH with
 * GRID_DESTINATION_IS_ME | GRID_DESTINATION_IS_GLOBAL (grid_decode.c:839-869)
 * and builds its REPORT at the global position, so a broadcast on a rig makes
 * EVERY module answer with frames that cannot be told apart. That is the whole
 * reason this takes sx and sy. The REPORT sets no LASTHEADER, so correlateById
 * is false, and the filter names no address, for the same reason storePage()'s
 * does not.
 *
 * WORD0..WORD3 are the ESP32-S3 eFuse MAC (grid_esp32_platform.c:139-181) -
 * the same six bytes the module's USB iSerialNumber is built from
 * (grid_esp32_usb.c:20-24), which the browser keys its permission on and
 * getInfo() refuses to expose. WORD2 and WORD3 are always zero on this chip;
 * the key still spans all four so a future chip cannot collide with this one.
 *
 * Source-verified, wire-unproven: no hardware capture holds a frame of this
 * class and the desktop editor never sends one. docs/INSTALL-RUNBOOK.md row A
 * is where it meets a module.
 */
export function fetchSerialNumber(sx: number, sy: number): GridRequest {
  return {
    label: "fetch-serial",
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "SERIALNUMBER",
      class_instr: "FETCH",
      class_parameters: {},
    },
    filter: { class_name: "SERIALNUMBER", class_instr: "REPORT" },
    timeoutMs: TIMEOUTS.fetchMs,
    correlateById: false,
  };
}

/**
 * MOVE THE MODULE'S ACTIVE PAGE (Phase 13, plan 13-12; 13-CONTEXT D-06).
 *
 * Class PAGEACTIVE, code 0x030, PAGENUMBER at offset 5, length 2 - read from
 * the pinned package's class table, not from the research. Addressed to the
 * ZONA's own SX/SY like a config write, never broadcast: on a rig every
 * module would otherwise change page at once.
 *
 * FIRE AND FORGET, AND THAT IS THE FIRMWARE'S SHAPE, NOT A SHORTCUT.
 * ../grid-fw/common/src/c/grid_decode.c:302-357 handles the EXECUTE with no
 * acknowledgement of any kind: it returns early when the page is already
 * active (:310), when page changes are disabled (:319) and when a bulk NVM
 * operation is in progress (:325), and otherwise starts the page load
 * (:349) - silently in every case. There is no PAGEACTIVE FETCH either: the
 * switch at :312 has an EXECUTE case and a REPORT case and nothing else, so
 * a FETCH would be a request that times out on every module. The module
 * tells the host which page it is on beside EVERY heartbeat
 * (grid_transport.c:199-203, a PAGEACTIVE/REPORT spliced into the type-1
 * heartbeat), and the active page moves at the start of the page load
 * (grid_ui.c:1017). So this descriptor has no filter, goes out through
 * sendImmediate, and the CONFIRMATION is the next heartbeat's report -
 * page-target.ts owns that wait, and a timeout there is `unverified`, never
 * `switched`.
 *
 * THE HEARTBEAT GOES FIRST. grid_decode.c:1279 clears page_change_enabled on
 * every successful CONFIG write and :717 says only a HEARTBEAT TYPE 255
 * restores it, so a switch sent straight after a write is refused silently
 * unless hostHeartbeat() precedes it. The ordering is page-target.ts's and is
 * asserted by its first test; this builder only says why it exists.
 *
 * Source-verified, wire-unproven: docs/INSTALL-RUNBOOK.md row I is where it
 * meets a module. Nothing here claims the switch works on hardware.
 */
export function pageActive(sx: number, sy: number, page: number): GridRequest {
  return {
    label: `switch-page-${page}`,
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "PAGEACTIVE",
      class_instr: "EXECUTE",
      class_parameters: { PAGENUMBER: page },
    },
    correlateById: false,
  };
}

/**
 * ASK THE MODULE HOW MANY PAGES IT HAS (Phase 13, plan 13-12).
 *
 * Class PAGECOUNT, code 0x031, PAGENUMBER at offset 5, length 2 (the pinned
 * package's class table). FETCH only: grid_decode.c:359-385 answers a FETCH
 * with a REPORT carrying grid_ui_state.page_count and ignores every other
 * instruction. The count is initialised to 4 at grid_ui.c:77, and that number
 * is deliberately NOT written anywhere in HANGAR: Bible section 9 says
 * "production enumerates supported pages", so the destination control lists
 * whatever this REPORT says and a module answering 2 offers two pages.
 *
 * Firmware accepts the FETCH as IS_ME | IS_GLOBAL (:361) and builds its
 * REPORT at the global position (:373), exactly as the serial-number fetch
 * does - so it is ADDRESSED here for the same reason fetchSerialNumber is,
 * the REPORT filter names no address for the same reason, and the descriptor
 * carries PAGENUMBER 0 because the encoder writes every declared field and
 * firmware does not read it on a FETCH.
 */
export function fetchPageCount(sx: number, sy: number): GridRequest {
  return {
    label: "fetch-page-count",
    descr: {
      brc_parameters: { DX: sx, DY: sy },
      class_name: "PAGECOUNT",
      class_instr: "FETCH",
      class_parameters: { PAGENUMBER: 0 },
    },
    filter: { class_name: "PAGECOUNT", class_instr: "REPORT" },
    timeoutMs: TIMEOUTS.fetchMs,
    correlateById: false,
  };
}

/**
 * RELOAD THE ACTIVE PAGE FROM FLASH - the firmware-native revert of a RAM
 * write (Phase 13, plan 13-12; 13-CONTEXT D-06's last clause; Bible section
 * 9's D03 row, "Revert device preview if supported").
 *
 * RESEARCHED, WRITTEN, AND UNPROVEN ON HARDWARE. Read, not assumed:
 * grid_decode.c:895-915 handles PAGEDISCARD/EXECUTE by starting
 * grid_ui_bulk_page_load for grid_ui_page_get_activepage() - the ACTIVE page,
 * never a parameter (the class carries only LASTHEADER, offset 5, length 2) -
 * with grid_protocol_nvm_load_success_callback as its callback, which sends a
 * PAGEDISCARD/ACKNOWLEDGE echoing the request id (:872-885) once the load
 * completes. A discard during a bulk operation is dropped with no reply
 * (:907-909), like a store. So the shape is storePage()'s: a global
 * broadcast, an id-correlated acknowledgement, the store's timeout, and a
 * page reload that restarts the Lua VM. What it does that the snapshot
 * restore does not: it needs no snapshot, because flash is the source.
 *
 * It ships as a descriptor and as one install-store action reachable from
 * the /dev/install/ probe, and from NO public control, until
 * docs/INSTALL-RUNBOOK.md row I confirms it on a module. If the bench refuses
 * it, the action goes and this comment records why; the snapshot restore,
 * which already works, was never removed.
 */
export function discardPage(): GridRequest {
  return {
    label: "discard",
    descr: {
      brc_parameters: { DX: -127, DY: -127 },
      class_name: "PAGEDISCARD",
      class_instr: "EXECUTE",
      class_parameters: {},
    },
    filter: { class_name: "PAGEDISCARD", class_instr: "ACKNOWLEDGE" },
    timeoutMs: TIMEOUTS.pagestoreMs,
    correlateById: true,
  };
}

/**
 * 32 lowercase hex characters: WORD0..WORD3, each unsigned, each padded to
 * eight. The `>>> 0` is load-bearing: a word above 2^31 can decode as a
 * negative number through Number() on some paths, and toString(16) of a
 * negative carries a sign, which would put a `-` in a key that is supposed to
 * be hex. The padding is what keeps two keys the same length whatever their
 * leading digits, so a key is comparable by string equality alone.
 */
export function moduleKeyOf(cls: DecodedClass): string {
  const word = (name: string) =>
    (Number(cls.class_parameters[name]) >>> 0).toString(16).padStart(8, "0");
  return word("WORD0") + word("WORD1") + word("WORD2") + word("WORD3");
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
