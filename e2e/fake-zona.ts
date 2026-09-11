// The ZONA that answers the browser, and it is the node suite's ZONA.
//
// A FIXTURE MODULE, NOT A TEST FILE. playwright.config.ts collects
// `**/*.e2e.ts`; this file matches nothing and contributes no title, and the
// count gate is what proves that. It exports one function, installZona(),
// which puts a Node-side function on `window.__hangarZona` through
// page.exposeFunction, and the type of the handle it returns to the test.
//
// THREE THINGS ABOUT THIS FILE.
//
// 1. IT IS THE SAME RESPONDER THE NODE SUITE USES. The function behind
//    __hangarZona strips the terminator off the chunk the fake port wrote,
//    decodes it with the real decoder, reads the request id off the real wire
//    exactly as FakeTransport does, and hands the class to zonaResponder from
//    src/lib/transport/fixtures/synthetic.ts - the scripted module every
//    install.spec.ts gate was proven against. So the browser can only reach a
//    state the unit tests can reach, and vice versa; a second scripted ZONA
//    written into the page-side init script would have been a second fake
//    that drifts from the first. The faults below are layered ON TOP of that
//    responder and never replace a line of it: an acknowledgement dropped, an
//    acknowledgement held, a first write refused, a re-fetch that lies, other
//    modules on the cable. The `$lib/protocol` import inside synthetic.ts
//    resolves here through the tsconfig paths the generated
//    .svelte-kit/tsconfig.json declares, which Playwright's loader honours;
//    plan 07-08 measured that before this file existed.
//
// 2. IT IS STILL MODELLED ON A SOURCE READING OF FIRMWARE. A fake answers
//    because it was told to. That the module NACKs a write to a page that is
//    not active, that the store's acknowledgement is sent by the callback
//    that starts the reload, that a busy store is dropped with no NACK at all
//    - each is a reading of grid_decode.c recorded in synthetic.ts, and this
//    file reproducing it is not evidence that hardware does it. That circle
//    is closed by a human with a module on the desk: docs/INSTALL-RUNBOOK.md
//    rows A, B and E, written by plan 07-13, are what turn the readings into
//    evidence. What this file proves completely is the round trip - write
//    out, decode in Node, reply in, decode in the page - and the class count
//    of everything a page wrote.
//
// 3. THE TWO FAKES DISAGREE ABOUT ATTEMPT DURATION, AND IT IS STATED HERE
//    RATHER THAN REDESIGNED. `delayAckMs` below holds the reply in Node with
//    a setTimeout, and because the fake port's write() sink AWAITS this
//    function's promise (e2e/fake-serial.ts), the page's write() itself
//    stalls for that long. FakeTransport's `delay` fault holds only the
//    reply and lets the write return at once. The request queue arms its
//    waiter BEFORE the write either way (src/lib/transport/queue.ts), so an
//    attempt still times out at executeMs 250 in both fakes; what differs is
//    where the attempt spends its time. A test that measures the gap between
//    a call and the frame leaving the transport must not be ported between
//    the two without reading this.
//
// THE DROP COUNTER IS PER CLASS AND ADVANCES ON DROPPED ACKNOWLEDGEMENTS TOO,
// which is the opposite of FakeTransport's per-fault `hits` map: there,
// dropped() returns at the FIRST due fault and the later-listed ones never see
// the reply that satisfied the earlier one, which is why 07-07's tests 12 and
// 13 list their drops in descending order. Here every acknowledgement of a
// class is numbered once, in the order it would have left the module, dropped
// or not, and a DropAck matches that number - so entries may be listed in any
// order and "never lands" is simply nth 1, 2 and 3 of the three attempts.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { Page } from "@playwright/test";
import {
  type DecodedClass,
  ELEMENT_TOUCH,
  EVENT_SETUP,
  TERMINATOR,
  ZONA_HWCFG,
  decodeFrame,
} from "../src/lib/protocol";
import {
  type Firmware,
  type ZonaState,
  configNackFrame,
  configReportFrame,
  heartbeatFrame,
  rigResponder,
  zonaResponder,
} from "../src/lib/transport/fixtures/synthetic";

/**
 * The classes the module acknowledges by id, and so the classes a script can
 * drop or hold. PAGEDISCARD joined the two in Phase 13, plan 13-12: the
 * responder answers the firmware-native revert with an acknowledgement of its
 * own class (synthetic.ts, grid_decode.c:872-885), so a test can script a
 * discard whose acknowledgement never lands, exactly as it can a store's.
 *
 * WHAT ELSE 13-12 TAUGHT THE FAKE, AND WHERE. The page switch, the page-count
 * report, the page-changes-disabled-by-a-write rule and the heartbeat that
 * restores it all live in synthetic.ts's responder, which this file hands
 * every class to unchanged (thing 1 in the header) - so the browser fake
 * learned them with no line of its own, and `heartbeatHex()` below already
 * reads `state.activePage`, which the responder moves on a switch: the next
 * beat a test pushes carries the new page, which is the whole of the
 * confirmation firmware gives. Thing 2 in the header applies in full: every
 * one of those is a source reading, and docs/INSTALL-RUNBOOK.md row I is
 * where the switch meets a module.
 */
type AckedClass = "CONFIG" | "PAGESTORE" | "PAGEDISCARD";

/** One acknowledgement of one class, by its cumulative number, to drop. */
export interface DropAck {
  class_name: AckedClass;
  nth: number;
}

export interface ZonaScript {
  /**
   * Drop the nth acknowledgement of this class - one entry, or several: a
   * retried write has one ACK per attempt, so "never lands" is nth 1, 2 and 3.
   * Counts are cumulative over the page's life and survive script(). The
   * counter is per CLASS and advances on dropped ACKs too - unlike
   * FakeTransport's per-fault hits map, where dropped() returns at the first
   * due fault and starves the later-listed ones (07-07 tests 12 and 13) - so
   * entries here may be listed in any order.
   */
  dropAck?: DropAck | DropAck[];
  /**
   * Hold every acknowledgement of this class by this many ms (a Node-side
   * setTimeout) - the page's write() stalls with it; see the header.
   */
  delayAckMs?: { class_name: AckedClass; byMs: number };
  /** Answer the first CONFIG/EXECUTE with a NACK echoing its id; nothing is written. */
  nackFirstWrite?: boolean;
  /**
   * Answer every re-fetch - a CONFIG/FETCH of Setup after the first
   * PAGESTORE/EXECUTE - with a Setup that differs from RAM.
   */
  mismatchRefetch?: boolean;
  /** Other modules on the cable, answering the broadcast store from their own addresses. */
  rig?: ZonaState[];
}

export interface ExposedZona {
  /** Outbound frames seen, decoded, by class - the SAFE-01 count. */
  seen(class_name: string, class_instr: string): number;
  /**
   * The module's RAM, flash and page. The same object the test passed in; edit
   * it to change what the module holds.
   *
   * `ZonaState` is IMPORTED from src/lib/transport/fixtures/synthetic.ts, not
   * re-declared here, so Phase 12's system-element maps (`system`,
   * `systemFlash`) arrived on this handle with no edit to this file. A test
   * that wants a non-factory library sets `state.system` and the same
   * responder answers it.
   */
  state: ZonaState;
  /** One heartbeat frame (hex, terminated) from the module's address and current page, for beat(). */
  heartbeatHex(): string;
  /**
   * Replace the script mid-test. page.exposeFunction cannot be re-registered,
   * and the exposed function reads a Node-side closure on EVERY call rather
   * than capturing the script at install - so this is the only way a fault
   * changes after goto. Tests 4 and 6 here and 07-12's 7, 9 and 10 use it.
   */
  script(next: ZonaScript): void;
}

/** The firmware the heartbeat reports: the RevH the Phase 2 capture recorded. */
const FIRMWARE: Firmware = { major: 1, minor: 5, patch: 5 };

/** What a lying re-fetch says Setup holds. Printable, and never a pair any probe writes. */
const MISMATCH_SETUP = "--[[@cb]]print(9)";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const hexOf = (frame: number[]): string =>
  Buffer.from([...frame, TERMINATOR]).toString("hex");

/**
 * page.exposeFunction("__hangarZona", ...) over the real responder. Call
 * BEFORE goto: the binding is installed for the page's whole life, and the
 * fake port reads it lazily on every write, so the order between this and the
 * context's init script does not matter - only that both precede the load.
 */
export async function installZona(
  page: Page,
  state: ZonaState,
  script: ZonaScript = {},
): Promise<ExposedZona> {
  let current = script;
  /** `${class_name}/${class_instr}` of every outbound class decoded. */
  const seen = new Map<string, number>();
  /** Acknowledgements numbered per class, dropped ones included. */
  const acks = new Map<string, number>();
  let nacked = false;
  let stored = false;

  const drops = (): DropAck[] => {
    const d = current.dropAck;
    if (d === undefined) return [];
    return Array.isArray(d) ? d : [d];
  };

  /** The responder for the CURRENT script: one module, or the rig. Cheap; both close over `state`. */
  const responder = () =>
    current.rig && current.rig.length > 0
      ? rigResponder([state, ...current.rig])
      : zonaResponder(state);

  /** The module's replies to one class, with the script's faults applied. */
  const replyTo = (cls: DecodedClass, requestId: number): number[][] => {
    const isConfig = cls.class_name === "CONFIG";
    if (
      current.nackFirstWrite &&
      !nacked &&
      isConfig &&
      cls.class_instr === "EXECUTE"
    ) {
      nacked = true;
      return [
        configNackFrame({ sx: state.sx, sy: state.sy, lastheader: requestId }),
      ];
    }
    if (cls.class_name === "PAGESTORE" && cls.class_instr === "EXECUTE") {
      stored = true;
    }
    let replies = responder()(cls, requestId);
    if (
      current.mismatchRefetch &&
      stored &&
      isConfig &&
      cls.class_instr === "FETCH" &&
      Number(cls.class_parameters.EVENTTYPE) === EVENT_SETUP &&
      // THE TOUCH ELEMENT'S SETUP, NAMED (Phase 12, plan 02). The fault is
      // "the module reports back a Setup that is not the one it holds", and
      // once the system element is also fetched at event 0 this condition
      // would otherwise fire on that fetch too - and answer it with a report
      // echoing element 0, which the system fetch's own filter would refuse,
      // turning a mismatch into a timeout. Behaviour today is unchanged:
      // nothing above the transport fetches 255 until 12-03.
      Number(cls.class_parameters.ELEMENTNUMBER) === ELEMENT_TOUCH
    ) {
      replies = [
        configReportFrame({
          sx: state.sx,
          sy: state.sy,
          page: Number(cls.class_parameters.PAGENUMBER),
          event: EVENT_SETUP,
          element: ELEMENT_TOUCH,
          config: MISMATCH_SETUP,
        }),
      ];
    }
    // Number every acknowledgement of its class, then drop the ones named.
    const kept: number[][] = [];
    for (const reply of replies) {
      const decoded = decodeFrame(reply);
      const head = decoded.ok ? decoded.classes[0] : undefined;
      if (head?.class_instr === "ACKNOWLEDGE") {
        const n = (acks.get(head.class_name) ?? 0) + 1;
        acks.set(head.class_name, n);
        if (
          drops().some((d) => d.class_name === head.class_name && d.nth === n)
        )
          continue;
      }
      kept.push(reply);
    }
    return kept;
  };

  const answer = async (hex: string): Promise<string[]> => {
    // The scanner emits frames without their terminator, so the decoder is
    // given the same shape here - FakeTransport.write, line for line.
    const frame = [...Buffer.from(hex, "hex")];
    if (frame[frame.length - 1] === TERMINATOR) frame.pop();
    const decoded = decodeFrame(frame);
    if (!decoded.ok) return [];
    const requestId = Number(decoded.classes[0]?.brc_parameters.ID ?? 0);
    const out: number[][] = [];
    for (const cls of decoded.classes) {
      const key = `${cls.class_name}/${cls.class_instr}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
      out.push(...replyTo(cls, requestId));
    }
    const held = current.delayAckMs;
    if (held) {
      const holds = out.some((reply) => {
        const d = decodeFrame(reply);
        return (
          d.ok &&
          d.classes[0]?.class_name === held.class_name &&
          d.classes[0]?.class_instr === "ACKNOWLEDGE"
        );
      });
      if (holds) await sleep(held.byMs);
    }
    return out.map(hexOf);
  };

  await page.exposeFunction("__hangarZona", answer);

  return {
    seen: (class_name, class_instr) =>
      seen.get(`${class_name}/${class_instr}`) ?? 0,
    state,
    heartbeatHex: () =>
      hexOf(
        heartbeatFrame({
          sx: state.sx,
          sy: state.sy,
          type: 1,
          hwcfg: ZONA_HWCFG,
          activePage: state.activePage,
          firmware: FIRMWARE,
        }),
      ),
    script: (next) => {
      current = next;
    },
  };
}
