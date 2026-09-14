// Inbound frames a real ZONA would send, built from real encoder output, and the scripted module that
// answers a live FakeTransport. The ONLY file outside src/lib/protocol/descriptors.ts allowed to call
// encode_packet and (with descriptors.ts, 13-12) to name the page-change class: forbidden-instructions
// .spec.ts excludes `fixtures/` because everything here is a frame HANGAR RECEIVES or the module's
// answer. Three facts shape every builder, executed against the pinned package: encode_packet emits
// exactly ONE class block (dist/index.js:3925-3998), so the USB-attached heartbeat's second block
// (grid_transport.c:199-203) is spliced by hand with LEN and checksum rewritten; encode_packet forces
// SX and SY to zero and the decoder subtracts 127, so the address bytes are rewritten to the module's
// own; the SERIALNUMBER report alone is built WITHOUT that rewrite, because firmware sends it from the
// global position (grid_decode.c:839-869) - the wire fact that forces the FETCH to be addressed (07-CONTEXT D-04).
// Decided at 12-02 / 13-12; see .planning/phases/13-gui-overhaul/13-12-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { grid } from "@intechstudio/grid-protocol";
import {
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  PROTOCOL_VERSION,
  SYSTEM_DEFAULT_SETUP,
  SYSTEM_EVENTS,
  type DecodedClass,
} from "$lib/protocol";

const STX = 2;
const ETX = 3;
const EOT = 4;

/**
 * The class on the second block of a USB-attached module's heartbeat: a REPORT beside every type-1
 * heartbeat (grid_transport.c:199-203). Since 13-12 the responder also ACCEPTS the EXECUTE form (the
 * switch descriptors.ts builds under D-06) and moves `activePage` as grid_ui.c:1017 does; the EXECUTE
 * itself is answered by nothing (grid_decode.c:302-357) - the next heartbeat is the whole confirmation.
 */
const PAGE_CLASS = "PAGEACTIVE";

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
 * Rewrite BRC LEN and append the checksum: decode_packet_frame requires `array.length - 2 === LEN`
 * (dist/index.js:4045-4048), and the checksum is the XOR of every byte before it, two lowercase hex characters (:3987-3993).
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
    class_name: PAGE_CLASS,
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
  /**
   * The element the report is ABOUT, echoed back as the module echoes it (grid_decode.c:1337-1338 maps
   * the system element back to 255). Defaults to the touch element, so every pre-Phase-12 literal is unchanged.
   */
  element?: number;
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
          ELEMENTNUMBER: opts.element ?? ELEMENT_TOUCH,
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

export function pagestoreAckFrame(opts: {
  lastheader: number;
  sx?: number;
  sy?: number;
}): number[] {
  return seal(
    inbound(
      {
        brc_parameters: GLOBAL,
        class_name: "PAGESTORE",
        class_instr: "ACKNOWLEDGE",
        class_parameters: { LASTHEADER: opts.lastheader },
      },
      // The store is a global broadcast and so is its acknowledgement; on a rig each module answers from
      // its own address, which is how a test counts three acknowledgements to one store (Pitfall 8).
      { sx: opts.sx ?? 0, sy: opts.sy ?? 0 },
    ),
  );
}

/** The answer to a PAGEDISCARD/EXECUTE once the reload has finished: the success callback's acknowledgement echoing the request id (grid_decode.c:872-885); a global broadcast, built as the store's is. */
function pagediscardAckFrame(opts: {
  lastheader: number;
  sx?: number;
  sy?: number;
}): number[] {
  return seal(
    inbound(
      {
        brc_parameters: GLOBAL,
        class_name: "PAGEDISCARD",
        class_instr: "ACKNOWLEDGE",
        class_parameters: { LASTHEADER: opts.lastheader },
      },
      { sx: opts.sx ?? 0, sy: opts.sy ?? 0 },
    ),
  );
}

/**
 * The answer to a PAGECOUNT/FETCH: the page count in a REPORT from the global position
 * (grid_decode.c:359-385), so built with encodeOne, not inbound(). The number is the STATE's, never a literal here.
 */
function pageCountReportFrame(count: number): number[] {
  return seal(
    message(
      encodeOne({
        brc_parameters: GLOBAL,
        class_name: "PAGECOUNT",
        class_instr: "REPORT",
        class_parameters: { PAGENUMBER: count },
      }),
    ),
  );
}

/**
 * The answer to a SERIALNUMBER/FETCH: WORD0..WORD3 in a 62-byte class block, built with encodeOne and
 * NOT with inbound() (fact 3 in the header): its SX and SY decode as -127, -127 whichever module answered.
 */
export function serialNumberReportFrame(
  words: readonly [number, number, number, number],
): number[] {
  return seal(
    message(
      encodeOne({
        brc_parameters: GLOBAL,
        class_name: "SERIALNUMBER",
        class_instr: "REPORT",
        class_parameters: {
          WORD0: words[0],
          WORD1: words[1],
          WORD2: words[2],
          WORD3: words[3],
        },
      }),
    ),
  );
}

/**
 * The two elements are held in two maps, each keyed by event number: `configs` keyed by event is what
 * the `moduleState` factory in e2e/install.e2e.ts and every state literal in synthetic.spec.ts pass,
 * so `system` arrived BESIDE it (12-03), with `systemFlash` beside `flash` for the same reason.
 */
export interface ZonaState {
  sx: number;
  sy: number;
  activePage: number;
  /** RAM, the TOUCH element's. What a fetch returns and what a write replaces. */
  configs: Record<number, string>;
  /** RAM, the SYSTEM element's (255). Absent means a factory module, materialised on first use as the package's own default. */
  system?: Record<number, string>;
  /** Flash: what a store copies configs into and what powerCycle restores; allocated as a copy of configs the first time RAM and flash can diverge. */
  flash?: Record<number, string>;
  /** The same, for the system element. Allocated on the same three occasions. */
  systemFlash?: Record<number, string>;
  /** WORD0..WORD3. Undefined means the module does not answer a SERIALNUMBER/FETCH at all. */
  serial?: readonly [number, number, number, number];
  /** What a PAGECOUNT/FETCH is answered with (13-12). Absent means firmware's initial value, 4 (grid_ui.c:77), the ONE place that number is written. */
  pageCount?: number;
  /**
   * grid_ui_state.page_change_enabled (13-12). Absent means enabled, as a module boots (grid_ui.c:79). A
   * successful CONFIG/EXECUTE clears it (grid_decode.c:1279); a host heartbeat TYPE 255 sets it and any
   * other type above 127 clears it (:717); a page switch is silently refused while it is clear (:319).
   */
  pageChangeEnabled?: boolean;
}

/** Firmware's initial page count, in the fixture and nowhere shipped (grid_ui.c:77). */
const FIRMWARE_INITIAL_PAGE_COUNT = 4;

/** Flash, allocated on first need as a copy of what RAM held at that moment. */
const flashOf = (state: ZonaState): Record<number, string> =>
  (state.flash ??= { ...state.configs });

/** The system element's RAM, allocated on first need as a factory module's: the package's own page-init default through SYSTEM_DEFAULT_SETUP, never typed here (D-20). */
const systemOf = (state: ZonaState): Record<number, string> =>
  (state.system ??= { [EVENT_SETUP]: SYSTEM_DEFAULT_SETUP });

/** The system element's flash, on the same three occasions as the touch one's. */
const systemFlashOf = (state: ZonaState): Record<number, string> =>
  (state.systemFlash ??= { ...systemOf(state) });

/**
 * What one element's RAM answers for one event. The system element answers the package's own default
 * for an event nobody has written, as firmware does: a factory module's 255/6 comes back as
 * SYSTEM_DEFAULT_TIMER (12.1-06) and its 255/4 as SYSTEM_DEFAULT_UTILITY (13-17) with no line added
 * here; a write to 255/4 is stored under its event like any other system write.
 */
const ramRead = (state: ZonaState, element: number, event: number): string => {
  if (element !== ELEMENT_SYSTEM) return state.configs[event] ?? "";
  const held = systemOf(state)[event];
  if (held !== undefined) return held;
  return SYSTEM_EVENTS.find((e) => e.value === event)?.defaultConfig ?? "";
};

/** What a power cycle does: RAM becomes flash, for BOTH elements. Pure, in place; the fact runbook row D checks on hardware. */
export function powerCycle(state: ZonaState): void {
  state.configs = { ...flashOf(state) };
  state.system = { ...systemFlashOf(state) };
}

/** A module addressed by name, or by the global address. */
const GLOBAL_ADDRESS = -127;
const isMe = (outbound: DecodedClass, state: ZonaState): boolean =>
  Number(outbound.brc_parameters.DX) === state.sx &&
  Number(outbound.brc_parameters.DY) === state.sy;
const isGlobal = (outbound: DecodedClass): boolean =>
  Number(outbound.brc_parameters.DX) === GLOBAL_ADDRESS &&
  Number(outbound.brc_parameters.DY) === GLOBAL_ADDRESS;

/**
 * The scripted ZONA a live FakeTransport answers with. It answers what firmware accepts, by address:
 * CONFIG is IS_ME only, PAGESTORE and SERIALNUMBER are IS_ME | IS_GLOBAL (grid_decode.c:839-869), which
 * is what lets rigResponder be a plain fan-out.
 */
export function zonaResponder(
  state: ZonaState,
): (outbound: DecodedClass, requestId: number) => number[][] {
  return (outbound, requestId) => {
    const { class_name, class_instr, class_parameters } = outbound;
    const event = Number(class_parameters.EVENTTYPE);
    const page = Number(class_parameters.PAGENUMBER);
    // The element the request names, routed on and echoed back; an absent field coerces to NaN, so it is defaulted explicitly.
    const element = Number(class_parameters.ELEMENTNUMBER ?? ELEMENT_TOUCH);
    const me = isMe(outbound, state);
    const meOrGlobal = me || isGlobal(outbound);

    if (class_name === "CONFIG" && class_instr === "FETCH" && me) {
      // Firmware answers a fetch of a page that is not active with an empty
      // string rather than an error (grid_ui.c:464-501), which is exactly the
      // shape D-09's write refusal exists to catch.
      const config =
        page === state.activePage ? ramRead(state, element, event) : "";
      return [
        configReportFrame({
          sx: state.sx,
          sy: state.sy,
          page,
          event,
          config,
          element,
        }),
      ];
    }
    if (class_name === "CONFIG" && class_instr === "EXECUTE" && me) {
      // Firmware's `currentpage` condition (grid_decode.c:1272): a write to a
      // page that is not the active one is REFUSED with a NACK echoing the id
      // and nothing is written. The backstop Pitfall 4 rests on, and the one
      // deterministic refusal the queue must never retry (Pitfall 7).
      if (page !== state.activePage) {
        return [
          configNackFrame({
            sx: state.sx,
            sy: state.sy,
            lastheader: requestId,
          }),
        ];
      }
      // RAM and flash are about to diverge: fix flash first if it never was. The two elements' RAMs are
      // SEPARATE, so a write to 255 can never overwrite the touch Setup (12-RESEARCH Pitfall 1).
      const written = String(class_parameters.ACTIONSTRING ?? "");
      if (element === ELEMENT_SYSTEM) {
        systemFlashOf(state);
        systemOf(state)[event] = written;
      } else {
        flashOf(state);
        state.configs[event] = written;
      }
      // grid_decode.c:1279, inside the accepted-write branch: every successful
      // write disables page changes until a host heartbeat TYPE 255 (13-12).
      state.pageChangeEnabled = false;
      return [
        configAckFrame({ sx: state.sx, sy: state.sy, lastheader: requestId }),
      ];
    }
    if (class_name === PAGE_CLASS && class_instr === "EXECUTE" && me) {
      // The switch (13-12), as grid_decode.c:302-357 has it and answered by NOTHING: already on that page
      // (:310), page changes disabled by a write (:319), or the load started (:349; grid_ui.c:1017). The
      // fake holds ONE page's strings and reloads RAM from its single flash - the shape of a load without
      // a second page's contents, stated as the fixture's limit.
      if (page === state.activePage) return [];
      if (state.pageChangeEnabled === false) return [];
      state.activePage = page;
      powerCycle(state);
      return [];
    }
    if (class_name === "PAGECOUNT" && class_instr === "FETCH" && meOrGlobal) {
      // grid_decode.c:359-385: FETCH only, answered from the global position.
      return [
        pageCountReportFrame(state.pageCount ?? FIRMWARE_INITIAL_PAGE_COUNT),
      ];
    }
    if (
      class_name === "PAGEDISCARD" &&
      class_instr === "EXECUTE" &&
      meOrGlobal
    ) {
      // grid_decode.c:895-915: reload the ACTIVE page from NVM, then the
      // success callback acknowledges (:872-885). RAM becomes flash for both
      // elements - what powerCycle() already models - and the page is the
      // active one, never a parameter. Unproven on hardware (runbook row I).
      powerCycle(state);
      return [
        pagediscardAckFrame({
          sx: state.sx,
          sy: state.sy,
          lastheader: requestId,
        }),
      ];
    }
    if (class_name === "HEARTBEAT" && class_instr === "EXECUTE") {
      // grid_decode.c:712-716: an editor heartbeat (TYPE above 127) sets
      // page_change_enabled to (TYPE == 255). Answered by nothing; the effect
      // is on the state, and it is what lets a switch after a write succeed
      // only when the restore heartbeat went first.
      const type = Number(class_parameters.TYPE);
      if (type > 127) state.pageChangeEnabled = type === 255;
      return [];
    }
    if (class_name === "PAGESTORE" && class_instr === "EXECUTE" && meOrGlobal) {
      // grid_decode.c:955-961: the store copies RAM into flash, then the
      // success callback reloads the page from flash and restarts the Lua VM.
      // The reload is a no-op on the bytes today, and it is the shape D-12's
      // re-fetch proof depends on.
      state.flash = { ...state.configs };
      state.configs = { ...state.flash };
      state.systemFlash = { ...systemOf(state) };
      state.system = { ...state.systemFlash };
      return [
        pagestoreAckFrame({
          sx: state.sx,
          sy: state.sy,
          lastheader: requestId,
        }),
      ];
    }
    if (
      class_name === "SERIALNUMBER" &&
      class_instr === "FETCH" &&
      meOrGlobal &&
      state.serial
    ) {
      return [serialNumberReportFrame(state.serial)];
    }
    // A host heartbeat is answered by nothing; nor is a request addressed to somebody else, or a serial fetch with no serial.
    return [];
  };
}

/**
 * Several modules on one cable. Each answers what it accepts; a broadcast is
 * answered by all, in bus order, which is how one PAGESTORE produces N
 * acknowledgements (Pitfall 8) and one broadcast SERIALNUMBER/FETCH produces
 * N reports from the same unusable address.
 */
export function rigResponder(
  states: ZonaState[],
): (outbound: DecodedClass, requestId: number) => number[][] {
  const modules = states.map((state) => zonaResponder(state));
  return (outbound, requestId) =>
    modules.flatMap((answer) => answer(outbound, requestId));
}
