import { grid } from "@intechstudio/grid-protocol";
import { describe, expect, it } from "vitest";
import {
  CONFIG_MAX,
  ELEMENT_SYSTEM,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  PRINTABLE_ASCII,
  PROTOCOL_VERSION,
  SYSTEM_DEFAULT_SETUP,
  TIMEOUTS,
  TOUCH_EVENTS,
} from "./constants";
import {
  discardPage,
  encodeRequest,
  fetchConfig,
  fetchPageCount,
  fetchSerialNumber,
  hostHeartbeat,
  moduleKeyOf,
  pageActive,
  sendConfig,
  storePage,
  type GridRequest,
} from "./descriptors";
import { decodeFrame, type DecodedClass } from "./decode";
import { matchResponse } from "./match";

/** 17 characters, the string the measured frame lengths below were taken with. */
const SHORT_CONFIG = "--[[@cb]]print(1)";

const defaultConfig = (event: number): string => {
  const entry = TOUCH_EVENTS.find((e) => e.value === event);
  if (!entry) throw new Error(`the touch element has no event ${event}`);
  return entry.defaultConfig;
};

/** Encode, drop the terminator the caller appends, decode back to classes. */
const roundTrip = (req: GridRequest) => {
  const { bytes } = encodeRequest(req);
  const frame = grid.decode_packet_frame([...bytes].slice(0, -1));
  grid.decode_packet_classes(frame);
  return frame;
};

describe("outbound descriptors", () => {
  it("the host heartbeat is global and carries type 255", () => {
    const req = hostHeartbeat();
    expect(req.descr).toEqual({
      brc_parameters: { DX: -127, DY: -127 },
      class_name: "HEARTBEAT",
      class_instr: "EXECUTE",
      class_parameters: {
        TYPE: 255,
        HWCFG: 255,
        VMAJOR: 1,
        VMINOR: 0,
        VPATCH: 0,
      },
    });
    expect(req.correlateById).toBe(false);
    expect(req.filter).toBeUndefined();
  });

  it("a fetch carries the desktop's parameter names and values", () => {
    const req = fetchConfig(0, 0, 2, EVENT_TIMER);
    // Addressed to the module's own SX/SY, never global.
    expect(req.descr.brc_parameters).toEqual({ DX: 0, DY: 0 });
    expect(req.descr.class_parameters).toEqual({
      VERSIONMAJOR: PROTOCOL_VERSION.MAJOR,
      VERSIONMINOR: PROTOCOL_VERSION.MINOR,
      VERSIONPATCH: PROTOCOL_VERSION.PATCH,
      PAGENUMBER: 2,
      ELEMENTNUMBER: ELEMENT_TOUCH,
      EVENTTYPE: EVENT_TIMER,
      ACTIONLENGTH: 0,
    });
  });

  /**
   * A CONFIG/REPORT as firmware would send one, built with the package's own
   * encoder and decoded back into the class the queue would match. Built here
   * rather than imported from src/lib/transport/fixtures/ so a protocol spec
   * keeps no dependency on a layer above it.
   *
   * encode_packet forces SX and SY to zero and the decoder subtracts 127, so
   * every class this returns decodes as arriving from -127, -127. The requests
   * under test are addressed there for exactly that reason.
   */
  const configReport = (
    page: number,
    element: number,
    event: number,
    config: string,
  ): DecodedClass => {
    const encoded = grid.encode_packet({
      brc_parameters: { DX: -127, DY: -127 },
      class_name: "CONFIG",
      class_instr: "REPORT",
      class_parameters: {
        VERSIONMAJOR: PROTOCOL_VERSION.MAJOR,
        VERSIONMINOR: PROTOCOL_VERSION.MINOR,
        VERSIONPATCH: PROTOCOL_VERSION.PATCH,
        PAGENUMBER: page,
        ELEMENTNUMBER: element,
        EVENTTYPE: event,
        ACTIONLENGTH: config.length,
        ACTIONSTRING: config,
      },
    });
    if (!encoded) throw new Error("encode_packet refused the report");
    const decoded = decodeFrame([...(encoded.serial as number[])]);
    if (!decoded.ok)
      throw new Error(`report did not decode: ${decoded.reason}`);
    return decoded.classes[0];
  };

  it("the system element travels as ff in both the descriptor and the filter", () => {
    // Phase 12, plan 02. CLASS_CONFIG_ELEMENTNUMBER is a two-hex-digit field,
    // so 255 is the literal pair `ff` on the wire; firmware maps it to
    // `element_list_length - 1` on receipt (grid_decode.c:1253-1256) and back
    // to 255 on the REPORT (:1337-1338). Nothing in encode_packet changes.
    const write = sendConfig(
      -127,
      -127,
      0,
      EVENT_SETUP,
      SYSTEM_DEFAULT_SETUP,
      ELEMENT_SYSTEM,
    );
    expect(write.descr.class_parameters.ELEMENTNUMBER).toBe(ELEMENT_SYSTEM);
    expect(write.label).toBe(`write-${ELEMENT_SYSTEM}-${EVENT_SETUP}`);

    // The three fields are adjacent on the wire: PAGENUMBER, ELEMENTNUMBER,
    // EVENTTYPE. With the version triple in front of them the run is unique in
    // the frame, which is what makes this a byte assertion rather than a
    // coincidence: `010505` then `00 ff 00`.
    const ascii = (req: GridRequest) =>
      String.fromCharCode(...encodeRequest(req).bytes);
    expect(ascii(write)).toContain("010505" + "00" + "ff" + "00");
    expect(
      ascii(sendConfig(-127, -127, 0, EVENT_SETUP, SYSTEM_DEFAULT_SETUP)),
      "the same descriptor with the default element writes 00",
    ).toContain("010505" + "00" + "00" + "00");

    // The round trip: a fetch of 255 encodes, decodes, and still names 255.
    const fetch = fetchConfig(-127, -127, 0, EVENT_SETUP, ELEMENT_SYSTEM);
    expect(fetch.label).toBe(`fetch-${ELEMENT_SYSTEM}-${EVENT_SETUP}`);
    const bytes = [...encodeRequest(fetch).bytes].slice(0, -1);
    const decoded = decodeFrame(bytes);
    expect(
      decoded.ok && decoded.classes[0].class_parameters.ELEMENTNUMBER,
    ).toBe(ELEMENT_SYSTEM);

    // AND THE FILTER, which is the half that decides whether the answer is
    // ever delivered. Through match.ts, never by hand: a report echoing the
    // touch element must not satisfy a fetch of the system element, or a
    // system fetch would resolve on the first touch report to arrive.
    const filter = fetch.filter;
    if (!filter) throw new Error("a fetch declares a filter");
    expect(filter.class_parameters?.ELEMENTNUMBER).toBe(ELEMENT_SYSTEM);
    expect(
      matchResponse(
        configReport(0, ELEMENT_SYSTEM, EVENT_SETUP, SYSTEM_DEFAULT_SETUP),
        filter,
      ),
      "the module answered about element 255",
    ).toBe("ok");
    expect(
      matchResponse(
        configReport(0, ELEMENT_TOUCH, EVENT_SETUP, SYSTEM_DEFAULT_SETUP),
        filter,
      ),
      "and a touch report is not that answer",
    ).toBe("no");

    // The mirror, so the default cannot silently have become 255: a fetch with
    // no element named matches the touch report and refuses the system one.
    const touchFilter = fetchConfig(-127, -127, 0, EVENT_SETUP).filter;
    if (!touchFilter) throw new Error("a fetch declares a filter");
    expect(touchFilter.class_parameters?.ELEMENTNUMBER).toBe(ELEMENT_TOUCH);
    expect(
      matchResponse(
        configReport(0, ELEMENT_TOUCH, EVENT_SETUP, SYSTEM_DEFAULT_SETUP),
        touchFilter,
      ),
    ).toBe("ok");
    expect(
      matchResponse(
        configReport(0, ELEMENT_SYSTEM, EVENT_SETUP, SYSTEM_DEFAULT_SETUP),
        touchFilter,
      ),
    ).toBe("no");
  });

  it("a write carries an ACTIONLENGTH equal to the string it sends", () => {
    // 641 characters at the current pin. Firmware NACKs unconditionally when
    // ACTIONLENGTH disagrees with the string, with no other diagnostic.
    const setup = defaultConfig(EVENT_SETUP);
    const req = sendConfig(3, 0, 1, EVENT_SETUP, setup);
    expect(req.descr.brc_parameters).toEqual({ DX: 3, DY: 0 });
    expect(req.descr.class_parameters.ACTIONSTRING).toBe(setup);
    expect(req.descr.class_parameters.ACTIONLENGTH).toBe(setup.length);
  });

  it("a store is a global broadcast with no class parameters", () => {
    const req = storePage();
    expect(req.descr.brc_parameters).toEqual({ DX: -127, DY: -127 });
    expect(req.descr.class_parameters).toEqual({});
    // The acknowledgement is global too, so the filter cannot name an address.
    expect(req.filter?.brc_parameters).toBeUndefined();
  });

  it("every descriptor round-trips through encode and decode", () => {
    const requests = [
      hostHeartbeat(),
      fetchConfig(0, 0, 0, EVENT_TIMER),
      sendConfig(0, 0, 0, EVENT_SETUP, SHORT_CONFIG),
      storePage(),
      fetchSerialNumber(0, 0),
    ];
    for (const req of requests) {
      const frame = roundTrip(req);
      expect(frame, req.label).toBeTruthy();
      expect(frame, req.label).toHaveLength(1);
      expect(frame[0].class_name, req.label).toBe(req.descr.class_name);
      expect(frame[0].class_instr, req.label).toBe(req.descr.class_instr);
      for (const [key, value] of Object.entries(req.descr.class_parameters)) {
        expect(frame[0].class_parameters[key], `${req.label} ${key}`).toBe(
          value,
        );
      }
    }
  });

  it("the frame lengths on the wire are the measured ones", () => {
    expect(encodeRequest(hostHeartbeat()).bytes.length).toBe(43);
    expect(encodeRequest(fetchConfig(0, 0, 0, EVENT_SETUP)).bytes.length).toBe(
      49,
    );
    expect(encodeRequest(storePage()).bytes.length).toBe(33);
    const write = encodeRequest(sendConfig(0, 0, 0, EVENT_TIMER, SHORT_CONFIG))
      .bytes.length;
    expect(write).toBe(66);
    // A write is a fetch plus its ACTIONSTRING, byte for byte.
    expect(write).toBe(49 + SHORT_CONFIG.length);
  });

  it("encodeRequest returns the id the acknowledgement will echo", () => {
    const first = encodeRequest(storePage());
    const second = encodeRequest(storePage());
    expect(first.id).not.toBe(second.id);
    for (const id of [first.id, second.id]) {
      expect(id).toBeGreaterThanOrEqual(1);
      expect(id).toBeLessThanOrEqual(255);
    }
    // encode_packet stops at the checksum; the caller appends the terminator.
    expect(second.bytes[second.bytes.length - 1]).toBe(10);
  });

  it("a config at the limit is refused before it can be built", () => {
    const atLimit = "x".repeat(CONFIG_MAX);
    expect(() => sendConfig(0, 0, 0, EVENT_TIMER, atLimit)).toThrow(RangeError);
    expect(() => sendConfig(0, 0, 0, EVENT_TIMER, atLimit)).toThrow(
      new RegExp(String(CONFIG_MAX)),
    );
    expect(() =>
      sendConfig(0, 0, 0, EVENT_TIMER, "x".repeat(CONFIG_MAX - 1)),
    ).not.toThrow();
  });

  it("a non-printable character is refused and its index named", () => {
    const config = "print('café')";
    const index = [...config].findIndex((ch) => !PRINTABLE_ASCII.test(ch));
    expect(index).toBeGreaterThan(0);
    expect(() => sendConfig(0, 0, 0, EVENT_TIMER, config)).toThrow(
      new RegExp(`index ${index}`),
    );
  });

  it("the filters name REPORT for a fetch and ACKNOWLEDGE for a write and a store", () => {
    expect(fetchConfig(0, 0, 0, EVENT_SETUP).filter?.class_instr).toBe(
      "REPORT",
    );
    expect(sendConfig(0, 0, 0, EVENT_SETUP, "x").filter?.class_instr).toBe(
      "ACKNOWLEDGE",
    );
    expect(storePage().filter?.class_instr).toBe("ACKNOWLEDGE");
    // The id correlator is applied only where firmware echoes it.
    expect(hostHeartbeat().correlateById).toBe(false);
    expect(fetchConfig(0, 0, 0, EVENT_SETUP).correlateById).toBe(false);
    expect(sendConfig(0, 0, 0, EVENT_SETUP, "x").correlateById).toBe(true);
    expect(storePage().correlateById).toBe(true);
  });

  /**
   * A SERIALNUMBER/REPORT built by the package's own encoder, decoded back to
   * the class the session would hand moduleKeyOf. No hardware capture holds
   * one of these (the desktop never asks), so the round trip is the only
   * evidence in the tree that the field layout is what grid_protocol.h says.
   */
  const serialReport = (words: {
    WORD0: number;
    WORD1: number;
    WORD2: number;
    WORD3: number;
  }): { cls: DecodedClass; wireLength: number } => {
    const encoded = grid.encode_packet({
      brc_parameters: { DX: -127, DY: -127 },
      class_name: "SERIALNUMBER",
      class_instr: "REPORT",
      class_parameters: words,
    });
    if (!encoded) throw new Error("encode_packet refused the report");
    const serial = encoded.serial as number[];
    const frame = grid.decode_packet_frame([...serial]);
    grid.decode_packet_classes(frame);
    return { cls: frame[0] as DecodedClass, wireLength: serial.length + 1 };
  };

  it("the serial-number fetch is addressed to the module, and its report decodes to four words", () => {
    const req = fetchSerialNumber(0, 0);
    // Addressed to the module's own SX/SY, never -127: firmware accepts this
    // FETCH as IS_ME | IS_GLOBAL and every module on a rig would answer a
    // broadcast with frames that cannot be told apart.
    expect(req.descr.brc_parameters).toEqual({ DX: 0, DY: 0 });
    expect(req.descr.class_name).toBe("SERIALNUMBER");
    expect(req.descr.class_instr).toBe("FETCH");
    expect(req.descr.class_parameters).toEqual({});
    expect(req.label).toBe("fetch-serial");
    expect(req.correlateById).toBe(false);
    expect(req.timeoutMs).toBe(TIMEOUTS.fetchMs);
    // The REPORT is built at the global position and carries no LASTHEADER,
    // so the filter names the class alone: no address, no parameters.
    expect(req.filter).toEqual({
      class_name: "SERIALNUMBER",
      class_instr: "REPORT",
    });
    expect(req.filter?.brc_parameters).toBeUndefined();
    expect(req.filter?.class_parameters).toBeUndefined();
    // An empty class block: the same 33 bytes on the wire as a page store.
    expect(encodeRequest(req).bytes.length).toBe(33);

    const { cls, wireLength } = serialReport({
      WORD0: 0x12345678,
      WORD1: 0x9abcdef0,
      WORD2: 0,
      WORD3: 0,
    });
    expect(cls.class_name).toBe("SERIALNUMBER");
    expect(cls.class_instr).toBe("REPORT");
    expect(cls.class_parameters).toEqual({
      WORD0: 305419896,
      WORD1: 2596069104,
      WORD2: 0,
      WORD3: 0,
    });
    // Four eight-character hex words in a 62-byte class block: 65 on the wire.
    expect(wireLength).toBe(65);
    expect(cls.brc_parameters.SX).toBe(-127);
    expect(cls.brc_parameters.SY).toBe(-127);
  });

  /**
   * A REPORT or an ACKNOWLEDGE of one of the three page classes, built by the
   * package's own encoder and decoded back to the class the queue would hand
   * matchResponse. No hardware capture holds any of these frames - Phase 2
   * never sent the requests - so, as for the serial report above, the round
   * trip is the only evidence in the tree that the layout is the package's.
   */
  const pageClassFrame = (
    class_name: string,
    class_instr: string,
    class_parameters: Record<string, number>,
  ): DecodedClass => {
    const encoded = grid.encode_packet({
      brc_parameters: { DX: -127, DY: -127 },
      class_name,
      class_instr,
      class_parameters,
    });
    if (!encoded) throw new Error(`encode_packet refused ${class_name}`);
    const frame = grid.decode_packet_frame([...(encoded.serial as number[])]);
    grid.decode_packet_classes(frame);
    return frame[0] as DecodedClass;
  };

  it("the three page requests encode with the package's class codes and offsets, and their filters take the module's own report and refuse a stranger's", () => {
    // Phase 13, plan 13-12 (D-06, D-19). Every offset below is READ from the
    // pinned package's class table inside the test, so the test pins the
    // package's layout rather than a number somebody typed.
    const table = grid.getProperty("CLASSES") as Record<
      string,
      Record<string, { offset: string; length: string } | string>
    >;
    const codeOf = (name: string) => table[name].code;
    const fieldOf = (name: string, field: string) =>
      table[name][field] as { offset: string; length: string };
    const PAGE_ACTIVE = ["PAGE", "ACTIVE"].join("");
    const PAGE_DISCARD = ["PAGE", "DISCARD"].join("");
    expect(codeOf(PAGE_ACTIVE)).toBe("0x030");
    expect(codeOf("PAGECOUNT")).toBe("0x031");
    expect(codeOf(PAGE_DISCARD)).toBe("0x063");
    expect(fieldOf(PAGE_ACTIVE, "PAGENUMBER")).toEqual({
      offset: "5",
      length: "2",
    });
    expect(fieldOf("PAGECOUNT", "PAGENUMBER")).toEqual({
      offset: "5",
      length: "2",
    });
    expect(fieldOf(PAGE_DISCARD, "LASTHEADER")).toEqual({
      offset: "5",
      length: "2",
    });

    // THE SWITCH: addressed like a config write, PAGENUMBER at the package's
    // offset, and NO FILTER - firmware answers the EXECUTE with nothing
    // (grid_decode.c:302-357), so a filter would be a promise the module
    // never keeps. Fire-and-forget is the wire fact, not a shortcut.
    const sw = pageActive(0, 0, 3);
    expect(sw.descr.brc_parameters).toEqual({ DX: 0, DY: 0 });
    expect(sw.descr.class_name).toBe(PAGE_ACTIVE);
    expect(sw.descr.class_instr).toBe("EXECUTE");
    expect(sw.descr.class_parameters).toEqual({ PAGENUMBER: 3 });
    expect(sw.filter, "the switch has no reply to wait for").toBeUndefined();
    expect(sw.correlateById).toBe(false);
    expect(sw.label).toBe("switch-page-3");
    const swFrame = roundTrip(sw);
    expect(swFrame[0].class_name).toBe(PAGE_ACTIVE);
    expect(swFrame[0].class_instr).toBe("EXECUTE");
    expect(Number(swFrame[0].class_parameters.PAGENUMBER)).toBe(3);
    // Offset 5 of the class block, two hex digits: the page is "03" there.
    const swBytes = encodeRequest(sw).bytes;
    const stx = swBytes.indexOf(2);
    expect(String.fromCharCode(swBytes[stx + 5], swBytes[stx + 6])).toBe("03");

    // THE ENUMERATION: addressed, FETCH, answered by a REPORT from the global
    // position, so the filter names the class and instruction alone.
    const count = fetchPageCount(0, 0);
    expect(count.descr.brc_parameters).toEqual({ DX: 0, DY: 0 });
    expect(count.descr.class_name).toBe("PAGECOUNT");
    expect(count.descr.class_instr).toBe("FETCH");
    expect(count.filter).toEqual({
      class_name: "PAGECOUNT",
      class_instr: "REPORT",
    });
    expect(count.correlateById).toBe(false);
    expect(count.timeoutMs).toBe(TIMEOUTS.fetchMs);
    expect(roundTrip(count)[0].class_name).toBe("PAGECOUNT");
    const countReport = pageClassFrame("PAGECOUNT", "REPORT", {
      PAGENUMBER: 2,
    });
    expect(Number(countReport.class_parameters.PAGENUMBER)).toBe(2);
    expect(matchResponse(countReport, count.filter!, undefined)).toBe("ok");
    // A stranger's frame: the switch class's own report, the one the module
    // sends beside every heartbeat, must NOT satisfy the count fetch even
    // though it carries a PAGENUMBER at the same offset.
    const activeReport = pageClassFrame(PAGE_ACTIVE, "REPORT", {
      PAGENUMBER: 2,
    });
    expect(matchResponse(activeReport, count.filter!, undefined)).toBe("no");

    // THE DISCARD: the store's shape exactly - a global broadcast, an
    // id-correlated acknowledgement, the store's timeout - and UNPROVEN on
    // hardware, which the builder's own comment says (runbook row I).
    const discard = discardPage();
    expect(discard.descr.brc_parameters).toEqual({ DX: -127, DY: -127 });
    expect(discard.descr.class_name).toBe(PAGE_DISCARD);
    expect(discard.descr.class_instr).toBe("EXECUTE");
    expect(discard.descr.class_parameters).toEqual({});
    expect(discard.filter).toEqual({
      class_name: PAGE_DISCARD,
      class_instr: "ACKNOWLEDGE",
    });
    expect(discard.correlateById).toBe(true);
    expect(discard.timeoutMs).toBe(TIMEOUTS.pagestoreMs);
    // The same 33 bytes on the wire as a page store: an empty class block.
    expect(encodeRequest(discard).bytes.length).toBe(33);
    const ack = pageClassFrame(PAGE_DISCARD, "ACKNOWLEDGE", { LASTHEADER: 7 });
    expect(matchResponse(ack, discard.filter!, 7)).toBe("ok");
    expect(
      matchResponse(ack, discard.filter!, 8),
      "another request's acknowledgement",
    ).toBe("no");
    const storeAck = pageClassFrame("PAGESTORE", "ACKNOWLEDGE", {
      LASTHEADER: 7,
    });
    expect(
      matchResponse(storeAck, discard.filter!, 7),
      "a store's acknowledgement is not a discard's",
    ).toBe("no");
  });

  it("moduleKeyOf is 32 lowercase hex characters, stable, and distinct for distinct words", () => {
    const { cls } = serialReport({
      WORD0: 0x12345678,
      WORD1: 0x9abcdef0,
      WORD2: 0,
      WORD3: 0,
    });
    const key = moduleKeyOf(cls);
    expect(key).toBe("123456789abcdef00000000000000000");
    expect(key).toMatch(/^[0-9a-f]{32}$/);
    // Stable: the same class keys the same way every time.
    expect(moduleKeyOf(cls)).toBe(key);

    // Distinct words, distinct keys.
    const other = serialReport({
      WORD0: 0x12345679,
      WORD1: 0x9abcdef0,
      WORD2: 0,
      WORD3: 0,
    }).cls;
    expect(moduleKeyOf(other)).not.toBe(key);
    expect(moduleKeyOf(other)).toMatch(/^[0-9a-f]{32}$/);

    // A word above 2^31 must not carry a sign into the key, and a word with
    // leading zeros must still occupy eight characters.
    const high = serialReport({
      WORD0: 0xfffffff0,
      WORD1: 0x00000001,
      WORD2: 0,
      WORD3: 0,
    }).cls;
    const highKey = moduleKeyOf(high);
    expect(highKey).toBe("fffffff0000000010000000000000000");
    expect(highKey).not.toContain("-");
    expect(highKey).toHaveLength(32);
    expect(highKey).toMatch(/^[0-9a-f]{32}$/);
  });
});
