// The USB identity of a ZONA, in a module that imports nothing (CONN-07).
//
// This literal used to live in constants.ts, which imports the pinned protocol
// package at module scope. That is correct for everything else in that file -
// the event numbers, the config limit and the heartbeat interval are READ from
// the package on purpose - but it meant that any module naming ZONA_USB
// statically pulled @intechstudio/grid-protocol with it: a 131,101-byte chunk,
// as 04-RESEARCH measured it. A site-wide device session has to name this
// filter on the load path of every route, from a header component that renders
// on the first paint of `/`, and a browse-only visitor who never connects
// anything must not download a compiler to learn that nothing is plugged in.
// So the literal moved here, where it costs nothing, and constants.ts
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
