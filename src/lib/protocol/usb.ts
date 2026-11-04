// The USB identity of a ZONA, in a module that imports nothing (CONN-07). The
// literal lived in constants.ts, which imports the pinned protocol package at
// module scope, so any module naming ZONA_USB statically pulled the whole
// package into its chunk; the site-wide device session names this filter from
// a header component on the first paint of `/`, and a browse-only visitor must
// not download a compiler to learn that nothing is plugged in. constants.ts
// re-exports it so $lib/protocol's surface is unchanged (06-03).
//
// Two identities since change 27 (BENCH-2026-09-16.txt section 27): the
// production ZONA moved from the ESP32-S3 to an RP2350 and enumerates under
// the Raspberry Pi vendor id.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** A vendor id and a product id, the two numbers a port's `getInfo()` reports. */
export interface ZonaUsbIdentity {
  readonly usbVendorId: number;
  readonly usbProductId: number;
}

/** The ESP32-S3 prototype (RevH): Espressif's vendor id, the application product id. */
export const ZONA_USB_PROTOTYPE = {
  usbVendorId: 0x303a,
  usbProductId: 0x8123,
} as const;

/**
 * The production ZONA (RevI, RP2350): the Raspberry Pi vendor id and the
 * product id the Raspberry Pi Foundation's PID program assigned to it
 * (grid-fw rp2350/main/grid_rp2350_usb.c:13-15).
 */
export const ZONA_USB_PRODUCTION = {
  usbVendorId: 0x2e8a,
  usbProductId: 0x1145,
} as const;

/**
 * CONN-07's filters: the only ones the browser's port picker is ever given,
 * and the identities a replugged port is recognised by. Application
 * identities only - the ESP32-S3's 0x8122 and the RP2350's BOOTSEL
 * 0x2E8A:0x000F are bootloader identities and are never listed, so HANGAR
 * cannot reach a module in DFU.
 */
export const ZONA_USB: readonly ZonaUsbIdentity[] = [
  ZONA_USB_PROTOTYPE,
  ZONA_USB_PRODUCTION,
];

/** Whether a port's reported ids are one of the identities above. */
export function isZonaUsb(info: {
  usbVendorId?: number;
  usbProductId?: number;
}): boolean {
  return ZONA_USB.some(
    (id) =>
      info.usbVendorId === id.usbVendorId &&
      info.usbProductId === id.usbProductId,
  );
}
