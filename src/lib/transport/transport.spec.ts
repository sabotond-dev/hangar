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
  "already-open",
  "unknown",
];

/**
 * Phase 2's control. Written once and compared against, rather than repeated as
 * a literal in six assertions where a typo would read as a passing test.
 */
const DEFAULT_LABEL = "Connect";

/** The five failures whose copy tells the visitor to click something. */
const NAMES_A_CONTROL: OpenFailure[] = [
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

  it("the copy names the control that is actually on the screen", () => {
    // D-23 / UI-SPEC W-18: Phase 4's control is called TRY ON DEVICE, and copy
    // that tells a visitor to click a button which is not on the screen is
    // worse than no copy. The label is the ONLY thing that moves - titles,
    // details and step ordering stay Phase 2's words.
    const joined = (copy: ReturnType<typeof failureCopy>) =>
      [copy.title, copy.detail, ...copy.steps].join(" ");

    // Asserted before the loop, so an emptied list cannot pass vacuously.
    expect(
      NAMES_A_CONTROL,
      "five of the seven failures name a control",
    ).toHaveLength(5);

    for (const failure of NAMES_A_CONTROL) {
      const relabelled = joined(
        failureCopy(failure, "raw text", "TRY ON DEVICE"),
      );
      expect(relabelled, `${failure} names Phase 4's control`).toContain(
        "TRY ON DEVICE",
      );
      expect(
        relabelled,
        `${failure} still names a button that is not on the screen`,
      ).not.toContain(DEFAULT_LABEL);

      const asPhaseTwo = joined(failureCopy(failure, "raw text"));
      expect(
        asPhaseTwo,
        `${failure} lost the default label the skeleton page relies on`,
      ).toContain(DEFAULT_LABEL);
    }

    // no-web-serial names no control under either label, and that is correct:
    // there is no button to click on a browser that cannot do it at all.
    const unsupported = joined(
      failureCopy("no-web-serial", "raw text", "TRY ON DEVICE"),
    );
    expect(
      unsupported,
      "the unsupported copy invented a control",
    ).not.toContain("TRY ON DEVICE");
    expect(unsupported, "the unsupported copy names a control").not.toContain(
      DEFAULT_LABEL,
    );
    expect(
      joined(failureCopy("no-web-serial", "raw text")),
      "the unsupported copy names a control by default",
    ).not.toContain(DEFAULT_LABEL);
  });

  it("a racing open is its own state and never the raw browser text", () => {
    // The two forms Chromium throws, constructed the way it constructs them
    // (serial_port.cc:121-122 and :114-116). Both are HANGAR bugs: a site-wide
    // session with a header control and a panel control bound to one action
    // reaches them on a double click, which a per-panel control could not.
    expect(
      classifyOpenError(
        new DOMException("The port is already open.", "InvalidStateError"),
      ),
    ).toBe("already-open");
    expect(
      classifyOpenError(
        new DOMException(
          "A call to open() is already in progress.",
          "InvalidStateError",
        ),
      ),
    ).toBe("already-open");

    // And the message text is never the discriminator. The same Chromium
    // words under a NetworkError are still a busy port, because the strings
    // are specified nowhere and are localisable.
    expect(
      classifyOpenError(
        new DOMException("The port is already open.", "NetworkError"),
      ),
      "the classifier matched on the message text",
    ).toBe("port-busy");
  });

  it("the already-open copy is a sentence with no recovery and no raw report", () => {
    const raw = "The port is already open.";
    const copy = failureCopy("already-open", raw, "TRY ON DEVICE");

    expect(copy.steps, "there is nothing a visitor can do about it").toEqual(
      [],
    );
    expect(copy.detail, "one literal, with a U+2014 em dash").toBe(
      "HANGAR is already connecting — one moment.",
    );
    expect(
      copy.detail,
      "the browser's words for this failure describe HANGAR's bug",
    ).not.toContain(raw);
    // UI-SPEC: it renders through the `unknown` row rather than as a tenth
    // state, so the title is that row's title and not a new one.
    expect(copy.title).toBe(failureCopy("unknown", raw).title);
  });
});
