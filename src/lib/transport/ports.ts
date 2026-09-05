// The light half of web-serial.ts: what a page can ask about a port without
// opening one (CONN-06, CONN-07).
//
// Everything here runs before any click and needs nothing from the protocol
// package: `getPorts()` wants no gesture, the USB filter is a pair of numbers,
// and `connected` is a boolean the browser already holds. Only OPENING a port
// needs the pinned package, and opening stays in web-serial.ts. The split
// exists so a site-wide session can decide the capability, attach its
// listeners and offer a silent reconnect on every route with no dynamic import
// at all - because the alternative, one static chain from a header component
// through $lib/transport to @intechstudio/grid-protocol, puts a 131,101-byte
// chunk (04-RESEARCH's measurement) on the first paint of `/` for a visitor
// who may never connect anything. This module imports exactly one thing, and
// that one thing imports nothing (06-03).
//
// Like web-serial.ts, none of this has a unit test of its own: every line
// needs a real `SerialPort`. The session's spec drives these through a fake
// port instead, and the hardware runbook covers the rest.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { ZONA_USB } from "$lib/protocol/usb";

/**
 * Whether a port carries the ZONA's USB identity.
 *
 * The identity test for the `connect` event, and the reason it is a function
 * rather than an inline comparison: a replugged port is a NEW SerialPort
 * object - the browser mints a fresh token for a re-added wired port - so a
 * session that compared object identity would never recognise the module it
 * had just lost. Identity is by `getInfo()` and never by `===`.
 */
export function isZonaPort(port: SerialPort): boolean {
  const info = port.getInfo();
  return (
    info.usbVendorId === ZONA_USB.usbVendorId &&
    info.usbProductId === ZONA_USB.usbProductId
  );
}

/**
 * Ports this origin has already been granted. Needs no user gesture, so it can
 * run on load: if a permitted ZONA is already attached, the page can offer an
 * instant reconnect instead of a fresh chooser.
 */
export async function grantedZonaPorts(): Promise<SerialPort[]> {
  const ports = await navigator.serial.getPorts();
  return ports.filter(isZonaPort);
}

/** Chrome 130+ / Firefox 151+ only, so it is feature-detected, never assumed. */
export function portIsAttached(port: SerialPort): boolean | undefined {
  return "connected" in port ? port.connected : undefined;
}
