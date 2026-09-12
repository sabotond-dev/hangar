// Inbound frames a real ZONA would send, built from real encoder output.
//
// This is the ONLY file outside src/lib/protocol/descriptors.ts allowed to call
// encode_packet, and (with descriptors.ts, since 13-12) one of two allowed to
// name the page-change class. forbidden-instructions.spec.ts excludes
// `fixtures/` from its scans, because everything here is a frame HANGAR
// RECEIVES - or, since Phase 13, plan 13-12, the scripted module's ANSWER to
// one it sends: the responder below models the page switch (D-06), the
// page-count report and the page discard, and the two firmware facts the
// switch lives or dies by - a successful config write disables page changes
// (grid_decode.c:1279) and only a host heartbeat TYPE 255 restores them
// (:717). A fake that did not model those two would let a switch sent
// straight after a write pass in every test and be refused on every module.
//
// Three facts shape every builder below, all executed against the pinned
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
//   3. The SERIALNUMBER report is the ONE inbound frame built WITHOUT that
//      rewrite. Firmware builds it with grid_msg_init_brc(...,
//      GRID_PARAMETER_GLOBAL_POSITION, ...) (grid_decode.c:839-869), so a real
//      report genuinely arrives from SX -127, SY -127 - a source address HANGAR
//      cannot use. That is the wire fact that forces the FETCH to be addressed
//      to one module rather than broadcast (Phase 7, 07-CONTEXT D-04 amended).
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
 * The class name on the second block of a USB-attached module's heartbeat: a
 * REPORT, something the module tells the host, beside every type-1 heartbeat
 * (grid_transport.c:199-203). Since 13-12 the responder below also ACCEPTS the
 * EXECUTE form of the same class - the switch descriptors.ts builds under
 * Phase 13's D-06 - and moves `activePage` the way grid_ui.c:1017 does, so
 * the next heartbeatFrame() built from the state carries the new page. That
 * is the whole confirmation firmware gives: the EXECUTE itself is answered by
 * nothing (grid_decode.c:302-357).
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
   * The element the report is ABOUT, echoed back exactly as the module echoes
   * it (grid_decode.c:1337-1338 maps the system element back to 255 before it
   * builds the REPORT). Optional and defaulting to the touch element, so every
   * fixture literal written before Phase 12 is unchanged; the responder below
   * passes the element it was asked about, which is what lets a fetch of 255
   * be answered instead of timing out against its own filter.
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
      // The store is a global broadcast and so is its acknowledgement; the
      // address is the module's own only because it has to be something. On a
      // rig each module answers from its own, which is how a test can count
      // three acknowledgements to one store (Pitfall 8).
      { sx: opts.sx ?? 0, sy: opts.sy ?? 0 },
    ),
  );
}

/**
 * The answer to a PAGEDISCARD/EXECUTE once the reload has finished: the
 * success callback's acknowledgement echoing the request id
 * (grid_decode.c:872-885). Built exactly as the store's is, for the same
 * reason - the discard is a global broadcast too (Phase 13, plan 13-12).
 */
export function pagediscardAckFrame(opts: {
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
 * The answer to a PAGECOUNT/FETCH: the module's page count in a REPORT from
 * the global position (grid_decode.c:359-385 builds it with
 * GRID_PARAMETER_GLOBAL_POSITION, like the serial-number report - so, like
 * that one, it is built with encodeOne and NOT with inbound()). The number is
 * the STATE's, never a literal here: the fixture's default is firmware's own
 * initial value and is named where the state is declared.
 */
export function pageCountReportFrame(count: number): number[] {
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
 * The answer to a SERIALNUMBER/FETCH: WORD0..WORD3 in a 62-byte class block.
 *
 * Built with encodeOne and NOT with inbound(): fact 3 in the header. Firmware
 * sends this report from the global position, so its SX and SY decode as
 * -127, -127 whichever module answered. The one inbound frame HANGAR receives
 * whose source address is deliberately unusable - which is why the FETCH that
 * provokes it is addressed, and why a broadcast fetch on a rig gets N answers
 * nobody can tell apart.
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
 * THE TWO ELEMENTS ARE HELD IN TWO MAPS, EACH KEYED BY EVENT NUMBER, and that
 * is a deliberate choice against the obvious one.
 *
 * 12-RESEARCH proposed a single map keyed `${element}/${event}`. It is the
 * tidier shape and it is not the one taken. `configs` keyed by event number is
 * what the `moduleState` FACTORY in e2e/install.e2e.ts and every state literal
 * in synthetic.spec.ts already pass, and re-keying them would be an edit at
 * every one of those call sites - in a file 12-03 also edits, with an edit list
 * already twenty-two numeric sites and eleven step-line arrays long. So
 * `configs` stays exactly as it was and `system` arrives BESIDE it, with
 * `systemFlash` beside `flash` for the same reason: install.spec.ts asserts
 * `state.flash` with `toEqual` against a two-key object, and a flash map that
 * had grown a system key would have moved that assertion for no gain.
 */
export interface ZonaState {
  sx: number;
  sy: number;
  activePage: number;
  /** RAM, the TOUCH element's. What a fetch returns and what a write replaces. */
  configs: Record<number, string>;
  /**
   * RAM, the SYSTEM element's (255) - the page-init slot the shared library
   * lives in. Absent means a factory module: it is materialised on first use
   * as the package's own default, never a literal.
   */
  system?: Record<number, string>;
  /**
   * Flash. What a store copies configs into and what powerCycle restores.
   * Optional so every existing literal keeps working: it is allocated as a
   * copy of configs the first time RAM and flash can diverge - the first
   * write, the first store, or the first power cycle, whichever comes first.
   */
  flash?: Record<number, string>;
  /** The same, for the system element. Allocated on the same three occasions. */
  systemFlash?: Record<number, string>;
  /** WORD0..WORD3. Undefined means the module does not answer a SERIALNUMBER/FETCH at all. */
  serial?: readonly [number, number, number, number];
  /**
   * What a PAGECOUNT/FETCH is answered with (Phase 13, plan 13-12). Absent
   * means firmware's own initial value, 4 (../grid-fw/common/src/c/grid_ui.c:77)
   * - a fact about the fake's model of the module, and the ONE place that
   * number is written: nothing shipped may assume it (Bible section 9).
   */
  pageCount?: number;
  /**
   * grid_ui_state.page_change_enabled (13-12). Absent means enabled, as a
   * module boots (grid_ui.c:79). A successful CONFIG/EXECUTE clears it
   * (grid_decode.c:1279); a host heartbeat TYPE 255 sets it and any other
   * type above 127 clears it (:717); a page switch is silently refused while
   * it is clear (:319). Optional so every existing literal is unchanged.
   */
  pageChangeEnabled?: boolean;
}

/** Firmware's initial page count, in the fixture and nowhere shipped (grid_ui.c:77). */
const FIRMWARE_INITIAL_PAGE_COUNT = 4;

/** Flash, allocated on first need as a copy of what RAM held at that moment. */
const flashOf = (state: ZonaState): Record<number, string> =>
  (state.flash ??= { ...state.configs });

/**
 * The system element's RAM, allocated on first need as what a factory module
 * holds there: the package's own 24-character page-init default, READ from the
 * pin through SYSTEM_DEFAULT_SETUP and never typed here (D-20's rule).
 */
const systemOf = (state: ZonaState): Record<number, string> =>
  (state.system ??= { [EVENT_SETUP]: SYSTEM_DEFAULT_SETUP });

/** The system element's flash, on the same three occasions as the touch one's. */
const systemFlashOf = (state: ZonaState): Record<number, string> =>
  (state.systemFlash ??= { ...systemOf(state) });

/**
 * What one element's RAM answers for one event. The system element answers the
 * package's own default for an event nobody has written - which is what
 * firmware does. That fall-through is how a factory module's 255/6 comes
 * back as SYSTEM_DEFAULT_TIMER since 12.1-06 (the fourth slot, D-03) with no
 * line added here, and how its 255/4 comes back as SYSTEM_DEFAULT_UTILITY
 * since 13-17 (the fifth slot, D-18 / D-19) - page-next, the module's own
 * utility button - with no line added either; a write to 255/4 is stored
 * under its event below like any other system write, so a Sandbox install's
 * utility body is what a refetch reads back and what a power cycle forgets.
 * Verified, not restructured, by sequence.spec.ts's five-slot round trip.
 */
const ramRead = (state: ZonaState, element: number, event: number): string => {
  if (element !== ELEMENT_SYSTEM) return state.configs[event] ?? "";
  const held = systemOf(state)[event];
  if (held !== undefined) return held;
  return SYSTEM_EVENTS.find((e) => e.value === event)?.defaultConfig ?? "";
};

/**
 * What a power cycle does: RAM becomes flash, for BOTH elements. Pure, in
 * place. A module that was written to but never stored comes back with what it
 * had before the write, which is the whole reason PUT BACK exists and the fact
 * runbook row D checks on hardware.
 */
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
 * The scripted ZONA a live FakeTransport answers with.
 *
 * It answers what firmware accepts, by address: CONFIG is IS_ME only, PAGESTORE
 * and SERIALNUMBER are IS_ME | IS_GLOBAL (grid_decode.c:839-869 for the serial,
 * the store's broadcast in storePage()'s comment). That rule is what lets
 * rigResponder be a plain fan-out - a broadcast is answered by every module,
 * an addressed request by one.
 */
export function zonaResponder(
  state: ZonaState,
): (outbound: DecodedClass, requestId: number) => number[][] {
  return (outbound, requestId) => {
    const { class_name, class_instr, class_parameters } = outbound;
    const event = Number(class_parameters.EVENTTYPE);
    const page = Number(class_parameters.PAGENUMBER);
    // THE ELEMENT THE REQUEST NAMES, routed on and echoed back. An absent
    // field decodes as undefined and coerces to NaN, which is neither element
    // and would be answered from `configs` - so it is defaulted to the touch
    // element explicitly rather than left to a coercion.
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
      // RAM and flash are about to diverge: fix flash first if it never was.
      // The two elements' RAMs are SEPARATE, so a write to 255 can never
      // overwrite the touch Setup - the conflation 12-RESEARCH's Pitfall 1
      // names, and the one this branch exists to make impossible.
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
      // THE SWITCH (Phase 13, plan 13-12), as grid_decode.c:302-357 has it and
      // answered by NOTHING, whatever happens: already on that page (:310),
      // page changes disabled by a write (:319), or the load started (:349,
      // the active page moving at grid_ui.c:1017). The only confirmation a
      // host ever gets is the next heartbeat carrying the new page, which
      // heartbeatFrame() builds from `activePage`. THE FAKE HOLDS ONE PAGE'S
      // STRINGS: a real module loads the target page's own configuration
      // from NVM, and this one reloads RAM from its single flash instead -
      // the shape of a load without a second page's contents. Stated as the
      // fixture's limit, not hidden.
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
    // A host heartbeat is answered by nothing at all. Firmware records it and
    // re-enables page changes; it never replies. Nor does a module answer a
    // request addressed to somebody else, or a serial fetch it has no serial
    // for.
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
