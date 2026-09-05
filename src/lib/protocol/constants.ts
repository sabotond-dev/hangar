// Pure protocol constants for the walking skeleton (FOUND-01).
//
// Anything the pinned protocol package already owns is READ from it rather
// than restated, so a pin bump moves these in one place and docs/PIN-POLICY.md
// stays the only ceremony. The numbers that are genuinely HANGAR's - timeouts,
// retry bound, identify window - are policy, and the two the hardware run
// settled were revised from the measurements in docs/SKELETON-RESULTS.md.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  ElementType,
  EventType,
  EventTypeToNumber,
  grid,
} from "@intechstudio/grid-protocol";

// CONN-07's USB filter moved to ./usb, a module with no imports, so a header
// component can name it on the first paint of `/` without pulling the pinned
// package in. Re-exported here so $lib/protocol's surface is unchanged (06-03).
export { ZONA_USB } from "./usb";

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

/**
 * Measured, not guessed. See docs/SKELETON-RESULTS.md section (c), against the
 * capture in src/lib/transport/fixtures/zona-hardware.json.
 *
 * Observed on a ZONA RevH / firmware 1.5.5 at 2 Mbaud, per-step sentAt to
 * settledAt, across both completed arms:
 *
 *   CONFIG/FETCH       11.9 - 29.7 ms   (n=148, p99 16.4)   desktop 250 ms
 *   CONFIG/EXECUTE     14.8 - 21.6 ms   (n=12)              desktop 500 ms
 *   PAGESTORE/EXECUTE  13.6 - 38.7 ms   (n=11)              desktop 3000 ms
 *
 * The two fast paths ship at roughly ten times the slowest thing ever observed
 * on them, which is also 15 to 18 times the p99: generous enough that a busy
 * module times out rather than a merely slow one, tight enough that three
 * bounded attempts plus retryBackoffMs still fit inside about 1.3 seconds.
 *
 * pagestoreMs is MEASURED AND UNCHANGED, which is not the same thing as never
 * measured. 3000 ms is ~78x the worst observed store, and it stays because a
 * store's cost is flash programming rather than the link, and because a
 * PAGESTORE that arrives while a bulk NVM operation is already running is
 * dropped with no ACK and no NACK at all (grid_decode.c:979-981) - a timeout is
 * the only signal that case produces, and it must mean "genuinely busy".
 *
 * Honest limit: nothing in the run exercised a busy or failing module. All
 * three numbers are headroom arguments over a clean idle link.
 */
export const TIMEOUTS = { fetchMs: 300, executeMs: 250, pagestoreMs: 3000 };
/**
 * Zero. See docs/SKELETON-RESULTS.md section (b): the same 20-request read-only
 * burst probe ran 20/20 with no timeout and no negative acknowledgement at both
 * settings, at p50 3.1 ms with no gap against 14.0 ms with it - about 11 ms
 * cheaper per request and nothing worse.
 *
 * The constant stays named rather than being deleted, because the mechanism the
 * desktop's undocumented sleep (engine.store.ts:372) would have defended
 * against was never actually exercised: a CONFIG/FETCH is 49 bytes outbound, so
 * the probe never put two back-to-back 690-957 byte CONFIG/EXECUTE frames into
 * the module's 2048-byte receive ring, which discards a whole message silently
 * when it cannot fit (grid_transport.c:151-153). If a config write ever times
 * out with no NACK, restoring a gap here is the first experiment.
 */
export const PRE_SEND_DELAY_MS = 0;
/**
 * The desktop's inherited 10 ms gap, kept as its own constant ONLY so that the
 * /dev/skeleton/ page's A/B pacing toggle still measures what its label says.
 * With PRE_SEND_DELAY_MS at 0 the toggle would otherwise send at 0 in both
 * positions and stamp every capture `pace-0`, which is worse than a no-op: it
 * would mislabel the arm. Since Phase 7 the install store also reads it as the
 * escalation target on a write timeout with no NACK (07-CONTEXT D-19); before
 * that, nothing in the shipped request path read it.
 */
export const DESKTOP_PRE_SEND_DELAY_MS = 10;
/** Bounded, unlike the desktop's unbounded recursion (engine.store.ts:337). */
export const RETRY_ATTEMPTS = 3;
/** Matches the vendored withRetry backoff so Phase 7 inherits one policy. */
export const retryBackoffMs = (attempt: number) => 120 * (attempt + 1);

/** The encoder writes each char as one byte; anything outside this corrupts framing. */
export const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;

/**
 * The installed package version, re-exported rather than restated.
 *
 * D-07's capture records the pin every run was measured against, and D-05
 * limits the skeleton page to two import names - so the page reaches the pin
 * through this surface instead of importing src/lib/protocol-pin.ts directly.
 * The literal itself stays in that one module, where protocol-pin.spec.ts
 * holds it against package.json and the lockfile.
 */
export { PROTOCOL_PIN } from "../protocol-pin";
