// Pure protocol constants for the walking skeleton (FOUND-01).
//
// Anything the pinned protocol package already owns is READ from it rather
// than restated, so a pin bump moves these in one place and docs/PIN-POLICY.md
// stays the only ceremony. The numbers that are genuinely HANGAR's - timeouts,
// retry bound, identify window - are policy, and plan 05 revises them from the
// hardware measurements recorded in docs/SKELETON-RESULTS.md.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  ElementType,
  EventType,
  EventTypeToNumber,
  grid,
} from "@intechstudio/grid-protocol";

/**
 * CONN-07: the only filter the browser's port picker is ever given. 0x8122 is
 * the bootloader identity and is never listed - HANGAR must not be able to
 * reach a module in DFU.
 */
export const ZONA_USB = { usbVendorId: 0x303a, usbProductId: 0x8123 } as const;

/** Identity is confirmed from the heartbeat's HWCFG, not from the USB filter. */
export const ZONA_HWCFG = 161;

/** One entry per event the touch element declares. */
export interface ElementEvent {
  defaultConfig: string;
  desc: string;
  value: number;
  key: string;
}

export const ELEMENT_TOUCH = 0;
export const EVENT_SETUP = EventTypeToNumber(EventType.SETUP);
export const EVENT_TIMER = EventTypeToNumber(EventType.TIMER);
export const TOUCH_EVENTS: ElementEvent[] = grid.get_element_events(
  ElementType.TOUCH,
);

export const PROTOCOL_VERSION = grid.getProperty("VERSION") as {
  MAJOR: number;
  MINOR: number;
  PATCH: number;
};
/** The desktop rejects a config at or above this (instructions.ts:166). */
export const CONFIG_MAX = grid.getProperty("CONFIG_LENGTH") as number;
/** 250 ms. The module heartbeats on an unconditional firmware timer. */
export const MODULE_HEARTBEAT_MS = grid.getProperty(
  "HEARTBEAT_INTERVAL",
) as number;

/** The desktop's editor heartbeat period (runtime-manager.store.ts:42). */
export const HOST_HEARTBEAT_MS = 300;
/** Six module heartbeats. Long enough to see the page report, short enough to feel instant. */
export const IDENTIFY_WINDOW_MS = 1500;
/** Three missed heartbeats, the desktop's isAlive rule (runtime.ts:2426-2430). */
export const MODULE_GONE_MS = 750;

export const BAUD_RATE = 2_000_000;
/** MDN's default is 255 bytes; a 690-byte REPORT would arrive as three chunks. */
export const READ_BUFFER_SIZE = 4096;

/** Starting values (D-08). Plan 05 replaces these with the measured ones. */
export const TIMEOUTS = { fetchMs: 1000, executeMs: 500, pagestoreMs: 3000 };
/** The desktop's undocumented pre-send sleep (engine.store.ts:372). A/B toggled to 0. */
export const PRE_SEND_DELAY_MS = 10;
/** Bounded, unlike the desktop's unbounded recursion (engine.store.ts:337). */
export const RETRY_ATTEMPTS = 3;
/** Matches the vendored withRetry backoff so Phase 7 inherits one policy. */
export const retryBackoffMs = (attempt: number) => 120 * (attempt + 1);

/** The encoder writes each char as one byte; anything outside this corrupts framing. */
export const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;
