// The USB identity of a ZONA, in a module that imports nothing (CONN-07). The
// literal lived in constants.ts, which imports the pinned protocol package at
// module scope, so any module naming ZONA_USB statically pulled the whole
// package into its chunk; the site-wide device session names this filter from
// a header component on the first paint of `/`, and a browse-only visitor must
// not download a compiler to learn that nothing is plugged in. constants.ts
// re-exports it so $lib/protocol's surface is unchanged (06-03).
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * CONN-07's filter: the only one the browser's port picker is ever given, and
 * the identity a replugged port is recognised by. The application identity
 * only - 0x8122 is the bootloader identity and is never listed, so HANGAR
 * cannot reach a module in DFU.
 */
export const ZONA_USB = { usbVendorId: 0x303a, usbProductId: 0x8123 } as const;
