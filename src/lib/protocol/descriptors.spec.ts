import { grid } from "@intechstudio/grid-protocol";
import { describe, expect, it } from "vitest";
import {
  CONFIG_MAX,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  EVENT_TIMER,
  PRINTABLE_ASCII,
  PROTOCOL_VERSION,
  TOUCH_EVENTS,
} from "./constants";
import {
  encodeRequest,
  fetchConfig,
  hostHeartbeat,
  sendConfig,
  storePage,
  type GridRequest,
} from "./descriptors";

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
});
