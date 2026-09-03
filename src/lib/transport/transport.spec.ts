import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { OpenFailure } from "./transport";
import { classifyOpenError, failureCopy } from "./transport";

// Every input here is a real DOMException, constructed the way the browser
// constructs it, so no test invents an error shape. The message string on the
// busy case is the literal Chromium produces on Windows, macOS and Linux
// (02-RESEARCH.md, "open() failure taxonomy") - recorded, never branched on.
const busy = () =>
  new DOMException("Failed to open serial port.", "NetworkError");
const cancelled = () =>
  new DOMException("No port selected by the user.", "NotFoundError");

const ALL_FAILURES: OpenFailure[] = [
  "no-web-serial",
  "insecure-context",
  "cancelled",
  "port-busy",
  "unplugged",
  "unknown",
];

const transportSource = () =>
  readFileSync(
    fileURLToPath(new URL("./transport.ts", import.meta.url)),
    "utf8",
  );

describe("open failure taxonomy (CONN-02, CONN-04, CONN-05)", () => {
  it("a busy port names Grid Editor and gives the recovery in order", () => {
    expect(classifyOpenError(busy())).toBe("port-busy");
    const copy = failureCopy("port-busy");
    expect(copy.detail, "the busy detail names the usual culprit").toContain(
      "Grid Editor",
    );
    expect(copy.title.length, "a busy port has a title").toBeGreaterThan(0);
  });

  it("a cancelled chooser is a different state from a busy port", () => {
    expect(classifyOpenError(cancelled())).toBe("cancelled");
    const chooser = failureCopy("cancelled");
    const held = failureCopy("port-busy");
    expect(chooser.title, "cancelling is not a fault").not.toBe(held.title);
    expect(chooser.detail).not.toBe(held.detail);
    expect(chooser.steps, "one step: try again").toHaveLength(1);
    expect(chooser.steps[0]).toContain("Connect");
  });

  it("an unplugged port is told apart from a busy one by the port's own connected flag", () => {
    // Same DOMException both times. The only discriminator is the port.
    expect(classifyOpenError(busy(), { connected: false })).toBe("unplugged");
    expect(classifyOpenError(busy(), { connected: true })).toBe("port-busy");
    expect(failureCopy("unplugged").detail, "name the cable").toMatch(/cable/i);
  });

  it("the recovery steps are exactly quit, unplug, wait, replug, reload, connect", () => {
    const steps = failureCopy("port-busy").steps;
    expect(steps, "CONN-04's recovery is six steps").toHaveLength(6);
    // Asserted in order, not as a set: "unplug, wait, replug" is the whole
    // point, and a set would pass with the replug before the unplug.
    const inOrder = ["Quit", "Unplug", "Wait", "Plug", "Reload", "Connect"];
    inOrder.forEach((word, i) => {
      expect(steps[i], `step ${i + 1} is the "${word}" step`).toContain(word);
    });
  });

  it("an unrecognised error still lands in a named state carrying its raw text", () => {
    expect(classifyOpenError(new Error("boom"))).toBe("unknown");
    expect(classifyOpenError(undefined)).toBe("unknown");
    const copy = failureCopy("unknown", "boom");
    expect(copy.title.length, "unknown is still a named state").toBeGreaterThan(
      0,
    );
    expect(copy.detail, "nothing is swallowed").toContain("boom");
  });

  it("no message says Chromium, and the unsupported one names the browsers that work", () => {
    // CONN-02: a visitor is told which browsers work, never an engine name
    // they have no way to map onto the icon on their desktop.
    for (const failure of ALL_FAILURES) {
      const copy = failureCopy(failure, "raw text");
      const all = [copy.title, copy.detail, ...copy.steps].join(" ");
      expect(all, `${failure} copy names an engine`).not.toContain("Chromium");
    }
    const unsupported = failureCopy("no-web-serial");
    const text = `${unsupported.title} ${unsupported.detail}`;
    expect(text).toContain("Chrome");
    expect(text).toContain("Edge");
    expect(text).toContain("Firefox 151");
    // And the module itself, so a future edit cannot reintroduce it in a
    // branch this spec does not enumerate.
    expect(transportSource(), "transport.ts names an engine").not.toContain(
      "Chromium",
    );
  });
});
