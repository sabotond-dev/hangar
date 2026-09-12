// Pure protocol constants for the walking skeleton (FOUND-01).
//
// Anything the pinned protocol package already owns is READ from it rather
// than restated, so a pin bump moves these in one place and docs/PIN-POLICY.md
// stays the only ceremony. The numbers that are genuinely HANGAR's - timeouts,
// retry bound, identify window - are policy, and the two the hardware run
// settled were revised from the measurements in docs/SKELETON-RESULTS.md.
//
// TWO ELEMENTS, FIVE OF THEIR SIX EVENTS. The touch element (0) carries both
// of its events, Setup (0) and Timer (6). The system element (255) carries
// three since Phase 13 (plan 13-17): its setup (0), because that slot runs
// first on every page load - ../grid-fw/common/src/lua/init.lua:46-50 calls
// `ele[#ele]:post_init_cb()` before the loop over every other element - which
// is where a library of functions the touch configurations call by name has
// to live (Phase 12, plan 02); its timer (6), the library's second half,
// which 255/0 arms with `self:tim()` because the gradient and the expiry
// machinery do not fit one 908-character slot in any variant
// (12.1-RESEARCH B.3; permitted by 13-CONTEXT D-19 on 2026-09-10, chosen by
// the user on 2026-09-11, 12.1-CONTEXT D-03); and its utility event (4), the
// Sandbox runtime's second slot, which the touch Setup pulls in with
// `ele[#ele]:map()` (13-CONTEXT D-18, the second probe: the PDF's own page-3
// surface does not fit two slots and does fit three; 13-15 measured every
// kind fitting on three, and a Knob beside an XY pad refused on two). Each
// default is read from the package below, is what CLEAR writes there, and is
// what a record from before the slot existed restores (12.1 D-22 for the
// timer; 13-17 for the utility).
//
// EVENT 4 OF THE SYSTEM ELEMENT IS WRITTEN SINCE 13-17, UNDER D-19. It was
// once refused (12-02) because event 4 is the module's physical utility
// button and its firmware default is `gpl(gpn())` - load the page that
// page_next names, i.e. advance a page (`gpn` is
// ../grid-fw/common/src/c/grid_protocol.h:354, `gpl` is :366 and lands in
// `l_grid_page_load`, ../grid-fw/common/src/c/grid_lua_api.c:1676-1714) - so
// writing that event changes what a button the visitor paid for does. That
// sentence is kept as the reason it was once refused; D-19 retired the
// refusal as a rule (2026-09-10: "HANGAR can do anything the Editor can" -
// the Editor writes 255/4, so HANGAR may). THE CONSEQUENCE, SAID PLAINLY:
// while a Sandbox surface is installed, the module's utility button runs the
// Sandbox runtime and NO LONGER TURNS THE PAGE. A Lua entry or a preset lands
// the firmware default there (the install store substitutes it for the empty
// string in one place, as it does for the other two system slots), so under
// a catalog configuration the button still turns the page. PUT BACK restores
// whatever the module held - the snapshot covers every slot HANGAR writes
// (`hangar.snapshot.v4`) - and CLEAR writes the default below. The slot is
// one row in sequence.ts's SLOTS, after 255/6 and 255/0 and before the touch
// pair, because a touch Setup that calls `ele[#ele]:map()` needs the body
// registered before it runs (SLOTS' reason one, one event over).
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

/** One entry per event an element declares. */
export interface ElementEvent {
  defaultConfig: string;
  desc: string;
  value: number;
  key: string;
}

export const ELEMENT_TOUCH = 0;
/**
 * The system element, addressed as 255 (Phase 12, plan 02).
 *
 * 255 is a wire value, not an index: CLASS_CONFIG_ELEMENTNUMBER is a two-hex-
 * digit field, firmware maps 255 to `element_list_length - 1` on receipt
 * (../grid-fw/common/src/c/grid_decode.c:1253-1256) and maps it back to 255 on
 * the REPORT (:1337-1338), so a fetch filter naming 255 matches the answer.
 * Nothing in the packet encoder changes for it - and the name of that function
 * is deliberately not written here, because forbidden-instructions.spec.ts
 * test 3 scans every shipped module for it and descriptors.ts is the only file
 * allowed to match.
 *
 * Its setup (0) and its timer (6) are addressed - the library's two halves -
 * and its utility event (4), the Sandbox runtime's second slot since 13-17.
 * The header says why 4 was once refused and what writing it changes.
 */
export const ELEMENT_SYSTEM = 255;
export const EVENT_SETUP = EventTypeToNumber(EventType.SETUP);
export const EVENT_TIMER = EventTypeToNumber(EventType.TIMER);
/** The utility event (4): the system element's physical button (13-17; D-18, D-19). */
export const EVENT_UTILITY = EventTypeToNumber(EventType.UTILITY);
export const TOUCH_EVENTS: ElementEvent[] = grid.get_element_events(
  ElementType.TOUCH,
);
/**
 * Setup (0), utility (4) and timer (6). All three are READ from the package so
 * a pin bump moves them here; all three are put on the wire (12-02, 12.1-06,
 * 13-17), and the header carries the utility-button history for the second
 * and what writing it changes.
 */
export const SYSTEM_EVENTS: ElementEvent[] = grid.get_element_events(
  ElementType.SYSTEM,
);

/** The event tables HANGAR is allowed to read a default out of, by element. */
const EVENTS_BY_ELEMENT = new Map<number, ElementEvent[]>([
  [ELEMENT_TOUCH, TOUCH_EVENTS],
  [ELEMENT_SYSTEM, SYSTEM_EVENTS],
]);

/**
 * One event's own default configuration, SELECTED BY ELEMENT AND EVENT NUMBER.
 *
 * Exported for constants.spec.ts, which asserts both throws: the five
 * constants below are the whole of its production use. An element declares its
 * events in whatever order the package builds them, and today the touch
 * element's order happens to be Setup then Timer - a coincidence, not a
 * contract. So the lookup is by `value`, and a missing element or a missing
 * event THROWS AT MODULE LOAD with the number in the message, rather than
 * handing `undefined` to a write that would then land on somebody's module.
 */
export function defaultFor(element: number, event: number): string {
  const events = EVENTS_BY_ELEMENT.get(element);
  if (!events) {
    throw new Error(
      `HANGAR addresses no element ${element}, so it has no default configuration to read`,
    );
  }
  const declared = events.find((e) => e.value === event);
  if (!declared) {
    throw new Error(
      `element ${element} declares no event ${event}, so it has no default configuration to read`,
    );
  }
  return declared.defaultConfig;
}

/**
 * The firmware's own Setup for the touch element - what the Editor's clear
 * writes back (A-48, D-20). It zeroes all 81 cells on layer 1, sets a dim
 * white base, and installs a `touch_cb` that lights the cells around a finger
 * by true Euclidean distance. The pad is NOT dead after a clear.
 */
export const TOUCH_DEFAULT_SETUP = defaultFor(ELEMENT_TOUCH, EVENT_SETUP);
/**
 * The firmware's own Timer for the touch element (A-48, D-20): a debug print.
 * The default Setup above starts no timer, so on a module that was not already
 * running one it never fires - and on one that was, it prints up the link.
 */
export const TOUCH_DEFAULT_TIMER = defaultFor(ELEMENT_TOUCH, EVENT_TIMER);
/**
 * The firmware's own Setup for the SYSTEM element - 24 characters, and what a
 * factory module's page-init slot holds before HANGAR writes a library into
 * it. Read from the package like the two above (D-20's rule), never typed: the
 * one literal of it in the tree is the test that pins the package's value.
 */
export const SYSTEM_DEFAULT_SETUP = defaultFor(ELEMENT_SYSTEM, EVENT_SETUP);
/**
 * The firmware's own Timer for the SYSTEM element - 22 characters, a debug
 * print like the touch element's, and what a factory module holds in the
 * slot the library's second half goes into (12.1-06, D-03). Read from the
 * package like the three above, never typed: constants.spec.ts pins the
 * package's value and asserts this file carries no literal of it. CLEAR
 * writes it back; a snapshot from before 12.1 restores it (12.1-CONTEXT
 * D-22).
 */
export const SYSTEM_DEFAULT_TIMER = defaultFor(ELEMENT_SYSTEM, EVENT_TIMER);
/**
 * The firmware's own utility script for the SYSTEM element - 19 characters,
 * page-next, what a factory module's utility button does (13-17; D-18,
 * D-19). Read from the package like the four above, never typed:
 * constants.spec.ts pins the package's value and asserts this file carries
 * no literal of its call outside the header's reason. CLEAR writes it back;
 * a Lua entry or a preset lands it through the store's substitution; a
 * snapshot from before 13-17 (`hangar.snapshot.v3` or older) restores it.
 */
export const SYSTEM_DEFAULT_UTILITY = defaultFor(ELEMENT_SYSTEM, EVENT_UTILITY);

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
/**
 * THE PAGE SWITCH'S WINDOW (Phase 13, plan 13-12; 13-CONTEXT D-06). After a
 * page switch (the EXECUTE descriptors.ts builds) the module answers with
 * nothing (grid_decode.c:302-357); the only confirmation is the page report
 * beside its next heartbeat, and the active page moves at the START of the
 * page load (grid_ui.c:1017), so on a healthy link the report carrying the
 * new page is at most one heartbeat period away. Six periods - the identify window's own arithmetic - is the
 * time HANGAR waits before it stops calling the switch pending and calls it
 * `unverified`: NOT switched, NOT failed, unknown, with Apply disabled until
 * a report or a reconnect says otherwise. The wait itself lives in
 * src/lib/device/page-target.ts, which imports nothing and is handed this
 * number by the install store.
 */
export const PAGE_SWITCH_WINDOW_MS = 6 * MODULE_HEARTBEAT_MS;
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
