import { readFileSync } from "node:fs";
import {
  GridScript,
  ModuleType,
  grid,
  initLuaFormatter,
} from "@intechstudio/grid-protocol";
import { beforeAll, describe, expect, it } from "vitest";
import {
  CONFIG_MAX,
  EVENT_SETUP,
  EVENT_TIMER,
  MODULE_HEARTBEAT_MS,
  PRINTABLE_ASCII,
  PROTOCOL_VERSION,
  TOUCH_DEFAULT_SETUP,
  TOUCH_DEFAULT_TIMER,
  TOUCH_EVENTS,
  ZONA_HWCFG,
  ZONA_USB,
  defaultFor,
} from "./constants";

const source = (file: string) =>
  readFileSync(new URL(file, import.meta.url), "utf8");

describe("protocol constants", () => {
  // The Lua formatter is WASM and is resolved once for the file: compressScript
  // THROWS until it has, and checkSyntax silently returns false, so a
  // canonicity gate that ran before it would report a correct string as broken.
  beforeAll(async () => {
    await initLuaFormatter();
  });

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

  it("carries the touch element's own two defaults, selected by event number", () => {
    // A-48 / D-20: CLEAR writes the firmware's own default configuration, not
    // emptiness, so these two strings are a wire fact and are pinned like one.
    expect(TOUCH_DEFAULT_SETUP).toBeDefined();
    expect(TOUCH_DEFAULT_TIMER).toBeDefined();
    expect([...TOUCH_DEFAULT_SETUP].length, "the Setup default").toBe(641);
    expect([...TOUCH_DEFAULT_TIMER].length, "the Timer default").toBe(22);

    // Printable ASCII, because the encoder writes each character as one byte,
    // and inside the module's own limit with room to spare.
    expect(PRINTABLE_ASCII.test(TOUCH_DEFAULT_SETUP)).toBe(true);
    expect(PRINTABLE_ASCII.test(TOUCH_DEFAULT_TIMER)).toBe(true);
    expect(TOUCH_DEFAULT_SETUP.length).toBeLessThan(CONFIG_MAX);
    expect(TOUCH_DEFAULT_TIMER.length).toBeLessThan(CONFIG_MAX);

    // BY EVENT NUMBER, never by array position. The package happens to declare
    // setup first and timer second today, so a positional read would pass -
    // which is exactly why the contract is the number and the position is a
    // coincidence. defaultFor throws for an event the element does not
    // declare, so a pin bump that renumbers or drops one fails at module load
    // instead of writing undefined to somebody's module.
    const byNumber = (event: number) =>
      TOUCH_EVENTS.find((e) => e.value === event)?.defaultConfig;
    expect(TOUCH_DEFAULT_SETUP).toBe(byNumber(EVENT_SETUP));
    expect(TOUCH_DEFAULT_TIMER).toBe(byNumber(EVENT_TIMER));
    expect(() => defaultFor(255)).toThrow(/no event 255/);
  });

  it("holds both defaults canonical under the pinned minifier", () => {
    // THE GATE THAT GOES RED ON A PIN BUMP, and the reason it is a test rather
    // than a comment. @intechstudio/grid-protocol is versioned by firmware
    // datestamp (1.YYYYMMDD.HHMM), not by semver, so a bump can move both the
    // defaultConfig strings and what compressScript makes of them. Raw equals
    // compressed today, which is what lets CLEAR send these two verbatim with
    // no compiler on the path; the day that stops being true, this test says
    // so before a visitor's module does.
    expect(GridScript.compressScript(TOUCH_DEFAULT_SETUP)).toBe(
      TOUCH_DEFAULT_SETUP,
    );
    expect(GridScript.compressScript(TOUCH_DEFAULT_TIMER)).toBe(
      TOUCH_DEFAULT_TIMER,
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
