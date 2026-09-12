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

// The control's name lives in install-copy.ts (section 9's `Apply to ZONA`
// since 13-18, D-23) beside the other write clicks, so WRITE_CLICKS and the
// button cannot drift; re-exported here so every caller of this module keeps
// its import.
export { TRY_ON_LABEL } from "./install-copy";

// capabilityOf lives in session-copy.ts, which imports nothing, so the session
// can decide the capability synchronously in the first hydrated frame rather
// than after a dynamic import has landed. Re-exported here so every existing
// caller and try-on.spec.ts test 1 keep working unchanged (06-02).
export { capabilityOf, type Capability } from "./session-copy";

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
      // The module on the USB cable reports heartbeat type 1
      // (grid_decode.c:695-700), which is the same rule identify() uses above
      // to find the ZONA. Arrival order on a chained rig is whatever the bus
      // produced, so the first entry in the map names an arbitrary module and
      // the refusal would tell a visitor about something they did not plug in.
      // The fallback keeps the sentence honest when nothing reports type 1 at
      // all: a module IS on the cable, so name one rather than none.
      const onCable = seen.find((m) => m.heartbeatType === 1) ?? seen[0];
      return { kind: "not-zona", moduleType: onCable.moduleType };
    }

    await sleep(pollMs);
  }
}
