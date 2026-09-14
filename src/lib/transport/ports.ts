// The light half of web-serial.ts: what a page can ask about a port without opening one (CONN-06,
// CONN-07). Everything here runs before any click and needs nothing from the protocol package -
// `getPorts()` wants no gesture, the USB filter is a pair of numbers, `connected` is a boolean - so a
// site-wide session can decide the capability, attach its listeners and offer a silent reconnect on
// every route with no dynamic import; the alternative puts a 131,101-byte chunk on the first paint of
// `/`. This module imports exactly one thing, and that one thing imports nothing (06-03). No unit test
// of its own (every line needs a real `SerialPort`); the session's spec drives these through a fake port.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { ZONA_USB } from "$lib/protocol/usb";

/**
 * Whether a port carries the ZONA's USB identity: by `getInfo()` and never by `===`, because a
 * replugged port is a NEW SerialPort object and a session comparing identity would never recognise it.
 */
export function isZonaPort(port: SerialPort): boolean {
  const info = port.getInfo();
  return (
    info.usbVendorId === ZONA_USB.usbVendorId &&
    info.usbProductId === ZONA_USB.usbProductId
  );
}

/**
 * Ports this origin has already been granted; needs no user gesture, so a permitted, attached ZONA can
 * be offered an instant reconnect on load. `serial` defaults to the browser's own AT CALL TIME, so
 * importing this file touches no global; the session passes its injected surface for node.
 */
export async function grantedZonaPorts(
  serial: { getPorts(): Promise<SerialPort[]> } = navigator.serial,
): Promise<SerialPort[]> {
  const ports = await serial.getPorts();
  return ports.filter(isZonaPort);
}

/** Chrome 130+ / Firefox 151+ only, so it is feature-detected, never assumed. */
export function portIsAttached(port: SerialPort): boolean | undefined {
  return "connected" in port ? port.connected : undefined;
}
