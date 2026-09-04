// TRY ON DEVICE: open, listen, name the module - and nothing else (D-13, D-22).
//
// There is no request queue here and no heartbeat keeper, and their absence is
// the feature. Nothing is requested, so nothing is written; and starting the
// keeper timer would itself be a write to hardware a visitor paid for.
// docs/SKELETON-RESULTS.md (a) and (d) are what make that sufficient: the host
// heartbeat is NOT required - arm B ran 271.5 s with it off and received 1,086
// inbound heartbeats - and the module reports its hardware config, its firmware
// and its active page four times a second, unprompted. Identification is
// therefore a purely passive fold over inbound frames, and the write path is
// not merely unused here but unreachable (asserted in try-on.spec.ts test 3).
//
// The whole module is pure over its arguments: it reads no global environment,
// tests no browser name, and takes an ALREADY OPEN transport, because the click
// handler that calls it must invoke requestPort() as its first statement with
// nothing awaited in front of it (transient activation expires). Plan 04-08
// owns that handler and the rendering of every state named below.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { FrameScanner, decodeFrame } from "$lib/protocol";
import {
  type GridTransport,
  type Identity,
  absorbFrame,
  identify,
  identifyTimedOut,
  newIdentifyState,
} from "$lib/transport";

/** The control's name, in one place, so the copy and the button cannot drift. */
export const TRY_ON_LABEL = "TRY ON DEVICE";

export type Capability = "unsupported" | "insecure" | "ok";

/**
 * A capability test over an explicit environment record, never a browser test.
 *
 * Absence beats insecurity: with no `navigator.serial` at all there is nothing
 * for HTTPS to secure, and "this browser cannot talk to hardware" names a fix
 * the visitor can act on while "this page needs HTTPS" does not.
 *
 * `insecure` is deliberately reachable here even though Chromium can barely
 * produce it - `navigator.serial` is [SecureContext] there, so an insecure page
 * has no serial property and lands in `unsupported` instead. UI-SPEC Screen 4
 * specifies two states keyed on two conditions, and a pure function over an
 * explicit record is what makes both branches reachable from a test rather than
 * only from a browser nobody has.
 */
export function capabilityOf(env: {
  hasSerial: boolean;
  secure: boolean;
}): Capability {
  if (!env.hasSerial) return "unsupported";
  if (!env.secure) return "insecure";
  return "ok";
}

/** UI-SPEC Screen 4's state machine, as a union the component holds. */
export type TryOnState =
  | "unsupported"
  | "insecure"
  | "idle"
  | "choosing"
  | "opening"
  | "identifying"
  | "identified"
  | "not-zona"
  | "silent"
  | "failed"
  | "unplugged-after";

/**
 * The three ways listening can end. `not-zona` and `silent` are separate
 * because they are two different sentences on screen: one module answered and
 * was the wrong one, versus nothing answered at all.
 */
export type IdentifyOutcome =
  | { kind: "identified"; identity: Identity }
  | { kind: "not-zona"; moduleType: string | undefined }
  | { kind: "silent" };

/** How often the fold is checked. Six of these fit inside the identify window. */
const POLL_MS = 50;

/**
 * Listen until the module names itself.
 *
 * Takes an ALREADY OPEN transport: the click handler must call requestPort()
 * as its first statement, so nothing on this path may sit in front of it.
 * It also never closes the transport - the port belongs to the session and not
 * to one identification attempt (UI-SPEC W-20), so the caller owns its lifetime
 * and the visible DISCONNECT ZONA control.
 *
 * `now`, `pollMs` and `sleep` are injected, with real defaults, purely so the
 * spec can drive the 1500 ms identify window without spending 1.5 s of wall
 * clock on every run.
 */
export async function identifyOnly(
  transport: GridTransport,
  opts: {
    now?: () => number;
    pollMs?: number;
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<IdentifyOutcome> {
  const now = opts.now ?? (() => performance.now());
  const pollMs = opts.pollMs ?? POLL_MS;
  const sleep =
    opts.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  const scanner = new FrameScanner();
  const state = newIdentifyState(now());

  // One scanner, one accumulator, one registration. A decode that fails is
  // skipped rather than reported: the guard returns undefined on all seven of
  // its failure exits and never a wrong answer, and a corrupt frame on a link
  // that heartbeats four times a second is replaced 250 ms later.
  transport.onData((chunk) => {
    for (const frame of scanner.push(chunk)) {
      const decoded = decodeFrame(frame);
      if (!decoded.ok) continue;
      absorbFrame(decoded.classes, state);
    }
  });

  for (;;) {
    const identity = identify(state);
    if (identity) return { kind: "identified", identity };

    if (identifyTimedOut(state, now())) {
      // Something answered and it was not a ZONA - or its firmware predates
      // the piggybacked page report. Either way a module is on the cable, and
      // that is a different sentence from silence.
      const seen = [...state.seen.values()];
      if (seen.length === 0) return { kind: "silent" };
      return { kind: "not-zona", moduleType: seen[0].moduleType };
    }

    await sleep(pollMs);
  }
}
