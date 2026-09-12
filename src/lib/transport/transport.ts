// The transport contract and the open-failure taxonomy (FOUND-01, D-04).
//
// Pure. Nothing here touches the DOM beyond the `SerialPort` type, so every
// branch is reachable from a node test - which matters, because the copy below
// is the only thing a visitor sees when the hardware half of this site fails,
// and the first real test of it is the hardware run in plan 04.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The one shape the queue, the capture and the fake all speak. */
export interface GridTransport {
  readonly isOpen: boolean;
  write(data: Uint8Array): Promise<void>;
  onData(cb: (chunk: Uint8Array) => void): void;
  onClose(cb: (reason: string) => void): void;
  close(): Promise<void>;
}

export type OpenFailure =
  | "no-web-serial"
  | "insecure-context"
  | "cancelled"
  | "port-busy"
  | "unplugged"
  | "already-open"
  | "unknown";

export interface FailureCopy {
  title: string;
  detail: string;
  steps: string[];
}

/**
 * CONN-01: a capability test, never a browser test.
 *
 * The installed typings declare `Navigator.serial` as non-optional, so
 * TypeScript will happily let a Safari build call it; this has to be a real
 * runtime branch. `isSecureContext` is checked here too because a build opened
 * from disk over `file://` is not one, and `navigator.serial` is simply absent
 * there - a symptom that reads as a browser problem and is not.
 */
export function webSerialAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serial" in navigator &&
    typeof isSecureContext !== "undefined" &&
    isSecureContext
  );
}

/**
 * Turn whatever `requestPort()` or `open()` threw into one named state.
 *
 * Matched on `DOMException.name`. The message a busy port carries is the
 * literal `Failed to open serial port.` on all three desktop platforms, but
 * that is a secondary signal to record, never to branch on (PITFALLS C1): it
 * is not specified anywhere and it is localisable.
 *
 * `port` is the port that was being opened. Its `connected` flag is what tells
 * an unplug apart from a busy port, since both surface as `NetworkError`. It
 * is feature-detected because `SerialPort.connected` is Chrome 130+ and
 * Firefox 151+ while the baseline here is Chrome 89.
 */
export function classifyOpenError(
  err: unknown,
  port?: { connected?: boolean },
): OpenFailure {
  if (err instanceof DOMException) {
    if (err.name === "NotFoundError") return "cancelled";
    if (err.name === "NetworkError") {
      if (port && "connected" in port && port.connected === false) {
        return "unplugged";
      }
      return "port-busy";
    }
    // Both InvalidStateError forms are HANGAR bugs wearing a DOMException:
    //   "The port is already open."               (serial_port.cc:121-122)
    //   "A call to open() is already in progress." (serial_port.cc:114-116)
    // A per-panel connect control could not reach either; a site-wide session
    // with a header control AND a panel control bound to one action reaches
    // them on a double click. The in-flight guard in the session is the fix
    // and this branch is the net under it.
    //
    // Branched on `name` for the same reason the busy case is: the two message
    // strings above are the browser's own, are specified nowhere, and are
    // localisable.
    if (err.name === "InvalidStateError") return "already-open";
  }
  return "unknown";
}

const UNSUPPORTED_DETAIL =
  "Chrome, Edge, or desktop Firefox 151 and newer can install to a ZONA. " +
  "Safari and every browser on iOS never can, and Chrome on Android only " +
  "reaches Bluetooth serial ports, not a ZONA on a cable. Everything else on " +
  "this site works here: the catalog, the simulator and the tuning knobs all " +
  "run without any hardware.";

/**
 * What the page shows for each failure. `raw` is the original error text and
 * is only used by the `unknown` case, so nothing is ever swallowed.
 *
 * `controlLabel` names the button the recovery steps tell the visitor to
 * click. Phase 2's page calls it Connect; Phase 4's calls it TRY ON DEVICE
 * (D-23, UI-SPEC W-18), and copy naming a button that is not on the screen is
 * worse than no copy.
 *
 * It is appended THIRD, after `raw`, and never in `raw`'s place: three
 * callers already pass `raw` positionally, so a label inserted second would
 * silently retarget all three onto the new parameter and fail nowhere except in
 * front of a visitor. An options object would rewrite exactly the three call
 * sites this trailing parameter exists to leave alone.
 */
export function failureCopy(
  f: OpenFailure,
  raw?: string,
  controlLabel = "Connect",
): FailureCopy {
  switch (f) {
    case "no-web-serial":
      // Names no control on purpose: there is no button to click on a browser
      // that cannot talk to hardware at all.
      return {
        title: "This browser can’t talk to hardware",
        detail: UNSUPPORTED_DETAIL,
        steps: ["Open this page in Chrome, Edge, or desktop Firefox 151+"],
      };
    case "insecure-context":
      return {
        title: "This page needs HTTPS",
        detail:
          "Talking to hardware is only allowed over HTTPS. Opening a built " +
          `file from disk isn’t a secure context either, which is why the ` +
          `${controlLabel} button does nothing there.`,
        steps: [
          "Open this site over HTTPS, or run it on localhost",
          `Click ${controlLabel} again`,
        ],
      };
    case "cancelled":
      return {
        title: "You closed the chooser",
        detail:
          "No port was picked, so nothing was opened and nothing was sent.",
        steps: [`Click ${controlLabel} again and pick your ZONA`],
      };
    case "port-busy":
      return {
        title: "Another program is holding the port",
        detail:
          "Grid Editor is the usual reason, and another HANGAR tab can be " +
          "holding it too. Only one program can hold a " +
          "serial port at a time, and Grid Editor takes it as soon as it " +
          "starts - including from its tray icon after you close its window.",
        steps: [
          "Close any other HANGAR tab",
          "Quit Grid Editor completely, from its tray icon, not just its window",
          "Unplug the ZONA",
          "Wait a few seconds",
          "Plug the ZONA back in",
          "Reload this page",
          `Click ${controlLabel} again`,
        ],
      };
    case "unplugged":
      return {
        title: "Your ZONA isn’t there any more",
        detail:
          "The module was picked but was gone by the time the port opened. " +
          "A loose or charge-only USB cable does this, and so does a hub " +
          "that can’t power the module.",
        steps: [
          "Check the cable is a data cable and is seated at both ends",
          "Plug the ZONA straight into the computer rather than through a hub",
          `Click ${controlLabel} again`,
        ],
      };
    case "already-open":
      // The `unknown` row's title with a sentence in place of the raw report,
      // and NO steps at all: this failure is a bug in this site, so there is
      // nothing for the visitor to do about it and no step that would help.
      // `raw` is deliberately not interpolated - the browser's own words here
      // describe HANGAR's mistake and mean nothing to the person reading them.
      return {
        title: "The port wouldn’t open",
        detail: "HANGAR is already connecting — one moment.",
        steps: [],
      };
    default:
      return {
        title: "The port wouldn’t open",
        detail: `The browser reported: ${raw ?? "no further detail"}`,
        steps: [
          `Unplug your ZONA, plug it back in, and click ${controlLabel} again`,
          "If it keeps happening, copy the message above into a bug report",
        ],
      };
  }
}
