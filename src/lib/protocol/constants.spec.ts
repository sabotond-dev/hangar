import { readFileSync } from "node:fs";
import { ModuleType, grid } from "@intechstudio/grid-protocol";
import { describe, expect, it } from "vitest";
import {
  CONFIG_MAX,
  EVENT_SETUP,
  EVENT_TIMER,
  MODULE_HEARTBEAT_MS,
  PROTOCOL_VERSION,
  TOUCH_EVENTS,
  ZONA_HWCFG,
  ZONA_USB,
} from "./constants";

const source = (file: string) =>
  readFileSync(new URL(file, import.meta.url), "utf8");

describe("protocol constants", () => {
  it("reads the 909 config limit and the 250 ms heartbeat interval from the pinned package", () => {
    expect(CONFIG_MAX).toBe(909);
    expect(MODULE_HEARTBEAT_MS).toBe(250);
    expect(CONFIG_MAX).toBe(grid.getProperty("CONFIG_LENGTH"));
    expect(MODULE_HEARTBEAT_MS).toBe(grid.getProperty("HEARTBEAT_INTERVAL"));
    // The limit is READ, never restated: a pin bump that moved it would move
    // this module with it, and docs/PIN-POLICY.md stays the only ceremony.
    expect(source("./constants.ts")).not.toMatch(/\b909\b/);
  });

  it("agrees with the touch element's own event table", () => {
    expect(EVENT_SETUP).toBe(0);
    expect(EVENT_TIMER).toBe(6);
    expect(TOUCH_EVENTS).toContainEqual(
      expect.objectContaining({ desc: "setup", value: EVENT_SETUP }),
    );
    expect(TOUCH_EVENTS).toContainEqual(
      expect.objectContaining({ desc: "timer", value: EVENT_TIMER }),
    );
  });

  it("identifies a ZONA only when the hwcfg is passed as a number", () => {
    expect(grid.module_type_from_hwcfg(ZONA_HWCFG)).toBe(ModuleType.ZONA);
    // The same value as a string is a silent undefined: module_type_from_hwcfg
    // compares against a numeric-coerced table, module_hwcfgs() returns the raw
    // string constants. Both coercions are required.
    expect(
      grid.module_type_from_hwcfg("161" as unknown as number),
    ).toBeUndefined();
    const entry = grid
      .module_hwcfgs()
      .find((e) => Number(e.hwcfg) === ZONA_HWCFG);
    expect(entry.revision).toBe("RevH");
  });

  it("filters the picker to the product identity and never the bootloader", () => {
    expect(ZONA_USB).toEqual({ usbVendorId: 0x303a, usbProductId: 0x8123 });
    // 0x8122 is the bootloader identity. HANGAR must not be able to reach a
    // module in DFU, so it is never offered to the picker.
    expect(ZONA_USB.usbProductId).not.toBe(0x8122);
  });

  it("carries the version triple the CONFIG descriptors send", () => {
    expect(typeof PROTOCOL_VERSION.MAJOR).toBe("number");
    expect(typeof PROTOCOL_VERSION.MINOR).toBe("number");
    expect(typeof PROTOCOL_VERSION.PATCH).toBe("number");
    expect(PROTOCOL_VERSION).toEqual(grid.getProperty("VERSION"));
  });
});
