import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as P from "$lib/protocol";
import {
  EVENT_SETUP,
  EVENT_TIMER,
  FrameScanner,
  IDENTIFY_WINDOW_MS,
  MODULE_HEARTBEAT_MS,
  PAGE_SWITCH_WINDOW_MS,
  TERMINATOR,
  type DecodedClass,
  decodeFrame,
} from "$lib/protocol";
import { FakeTransport } from "$lib/transport/fake";
import {
  type ZonaState,
  zonaResponder,
} from "$lib/transport/fixtures/synthetic";
import { RequestQueue } from "$lib/transport/queue";
import { writeAll } from "$lib/transport/sequence";
import { PageTarget, type PageTargetView } from "./page-target";

/**
 * Phase 13, plan 13-12: the page target against the scripted ZONA, in node,
 * off the wire. Four tests, each one of D-06's clauses turned into an
 * assertion: the heartbeat-first order, the ACK gate on the module's own
 * report, the timeout that is `unverified` and never switched, and the
 * enumeration from the module's answer rather than from a number.
 *
 * The module here is synthetic.ts's responder, which since this plan models
 * the two firmware facts the switch lives or dies by: a successful config
 * write disables page changes (grid_decode.c:1279) and only a host heartbeat
 * TYPE 255 restores them (:717). So test 1 is not a test of call order in
 * HANGAR's own code - it is a test that the FAKE accepted the switch, which
 * it refuses without the heartbeat exactly as a module would.
 */

const ACTIVE_PAGE = 1;
const OTHER_PAGE = 3;
const ADDRESS = { sx: 0, sy: 0 };
const SETUP = "--[[@cb]]print(1)";
const TIMER = "--[[@cb]]print(2)";

const PAGE_ACTIVE = ["PAGE", "ACTIVE"].join("");

const zonaState = (over: Partial<ZonaState> = {}): ZonaState => ({
  sx: 0,
  sy: 0,
  activePage: ACTIVE_PAGE,
  configs: { [EVENT_SETUP]: SETUP, [EVENT_TIMER]: TIMER },
  ...over,
});

interface Rig {
  state: ZonaState;
  transport: FakeTransport;
  queue: RequestQueue;
  target: PageTarget;
  views: PageTargetView[];
}

/** The frame pump the install store owns: chunks in, classes into the queue. */
function pump(transport: FakeTransport, queue: RequestQueue): void {
  const scanner = new FrameScanner();
  transport.onData((chunk) => {
    for (const frame of scanner.push(chunk)) {
      const decoded = decodeFrame(frame);
      if (decoded.ok) for (const cls of decoded.classes) queue.deliver(cls);
    }
  });
  transport.onClose((reason) => queue.abort(reason));
}

function rig(over: Partial<ZonaState> = {}): Rig {
  const state = zonaState(over);
  const transport = new FakeTransport({ responder: zonaResponder(state) });
  const queue = new RequestQueue(transport, { preSendDelayMs: 0 });
  pump(transport, queue);
  const views: PageTargetView[] = [];
  const target = new PageTarget({
    windowMs: PAGE_SWITCH_WINDOW_MS,
    onChange: (view) => views.push(view),
  });
  // What the install store does at connect: the module's first report.
  target.observeReport(state.activePage);
  return { state, transport, queue, target, views };
}

/** Every outbound frame, decoded back into the classes it carried, flat. */
function written(transport: FakeTransport): DecodedClass[] {
  return transport.writes.flatMap((bytes) => {
    const frame = [...bytes];
    if (frame[frame.length - 1] === TERMINATOR) frame.pop();
    const decoded = decodeFrame(frame);
    if (!decoded.ok)
      throw new Error(`a written frame did not decode: ${decoded.reason}`);
    return decoded.classes;
  });
}

const classNames = (classes: DecodedClass[]) =>
  classes.map((c) => `${c.class_name}/${c.class_instr}`);

afterEach(() => {
  vi.useRealTimers();
});

describe("the page target (13-12, D-06)", () => {
  it("a switch sends the restore heartbeat BEFORE the page change, proved by the frame order - and still does straight after a write, which is the case the order exists for", async () => {
    const { state, transport, queue, target } = rig();

    // A write first: the fake now has page changes DISABLED, as firmware does
    // after every successful config write (grid_decode.c:1279). The install
    // store's own restore heartbeat after a RAM leg is deliberately NOT sent
    // here, so the switch below can succeed only if the target sends its own.
    await writeAll(
      queue,
      { sx: 0, sy: 0, page: ACTIVE_PAGE },
      {
        systemTimer: P.SYSTEM_DEFAULT_TIMER,
        system: P.SYSTEM_DEFAULT_SETUP,
        systemUtility: P.SYSTEM_DEFAULT_UTILITY,
        setup: SETUP,
        timer: TIMER,
      },
    );
    expect(state.pageChangeEnabled, "the fake models :1279").toBe(false);
    const before = transport.writes.length;

    // The review opens and sends NOTHING.
    expect(target.request(OTHER_PAGE)).toBe(true);
    expect(target.status).toBe("requested");
    expect(transport.writes.length, "a request is not a write").toBe(before);

    // The affirmative: two frames, one order.
    await target.confirm(queue, P, ADDRESS);
    const sent = written(transport).slice(-2);
    expect(classNames(sent)).toEqual([
      "HEARTBEAT/EXECUTE",
      `${PAGE_ACTIVE}/EXECUTE`,
    ]);
    expect(
      Number(sent[0].class_parameters.TYPE),
      "TYPE 255 restores page change",
    ).toBe(255);
    expect(Number(sent[1].class_parameters.PAGENUMBER)).toBe(OTHER_PAGE);
    // Addressed to the module, never broadcast: a rig would otherwise switch every module.
    expect(Number(sent[1].brc_parameters.DX)).toBe(0);
    expect(Number(sent[1].brc_parameters.DY)).toBe(0);
    expect(transport.writes.length - before, "exactly two frames").toBe(2);

    // And the fake ACCEPTED it, which it would not have without the heartbeat
    // (the negative check drops the heartbeat and this line goes red).
    expect(state.activePage, "the module moved").toBe(OTHER_PAGE);
    expect(state.pageChangeEnabled).toBe(true);

    // Nothing else was written: the switch is not a config write and it did
    // not store, discard or fetch anything on its way.
    const tail = classNames(written(transport).slice(-2));
    expect(tail.filter((c) => c.startsWith("CONFIG/"))).toEqual([]);
    expect(tail.filter((c) => c.startsWith("PAGESTORE/"))).toEqual([]);
  });

  it("Apply is disabled from the affirmative until the module's OWN report carries the requested page; a report of another page updates `reported` and leaves it disabled", async () => {
    const { queue, target, views } = rig();
    expect(target.canApply(), "at rest, the target is the reported page").toBe(
      true,
    );
    expect(target.requested).toBe(ACTIVE_PAGE);

    target.request(OTHER_PAGE);
    expect(target.canApply(), "a review is open").toBe(false);
    await target.confirm(queue, P, ADDRESS);
    expect(target.status).toBe("switching");
    expect(target.canApply(), "between the switch and the report").toBe(false);

    // A heartbeat that was already in flight, or a module that refused:
    // the report carries the page it was on. Recorded, and the gate holds.
    target.observeReport(ACTIVE_PAGE);
    expect(target.reported).toBe(ACTIVE_PAGE);
    expect(target.requested).toBe(OTHER_PAGE);
    expect(target.status).toBe("switching");
    expect(target.canApply()).toBe(false);

    // A stranger's page, likewise.
    target.observeReport(2);
    expect(target.reported).toBe(2);
    expect(target.status).toBe("switching");
    expect(target.canApply()).toBe(false);

    // The module's own report of the requested page, and only that, opens the gate.
    target.observeReport(OTHER_PAGE);
    expect(target.status).toBe("reported");
    expect(target.reported).toBe(OTHER_PAGE);
    expect(target.requested).toBe(OTHER_PAGE);
    expect(target.canApply()).toBe(true);

    // The mirror saw every CHANGE, as whole views, in order - and only the
    // changes: the report of page 1 while page 1 was already the reported
    // page moved nothing and published nothing, so a module heartbeating the
    // same page four times a second does not re-render the bar four times a
    // second.
    expect(views.map((v) => [v.status, v.reported])).toEqual([
      ["reported", ACTIVE_PAGE], // the first report at connect
      ["requested", ACTIVE_PAGE],
      ["switching", ACTIVE_PAGE],
      ["switching", 2], // reported 2, still switching
      ["reported", OTHER_PAGE],
    ]);

    // The one condition is the one the store reads: at rest and agreeing.
    // A target that has never heard the module cannot apply either.
    const fresh = new PageTarget({ windowMs: PAGE_SWITCH_WINDOW_MS });
    expect(fresh.canApply()).toBe(false);
  });

  it("no report inside the window lands `unverified` - Apply stays disabled, nothing reads as switched - and a late report still resolves it", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { queue, target, views } = rig();

    // The window is the constant the store hands in: six module heartbeats,
    // the identify window's own arithmetic, read here and never retyped.
    expect(PAGE_SWITCH_WINDOW_MS).toBe(6 * MODULE_HEARTBEAT_MS);
    expect(PAGE_SWITCH_WINDOW_MS).toBe(IDENTIFY_WINDOW_MS);

    target.request(OTHER_PAGE);
    await target.confirm(queue, P, ADDRESS);
    expect(target.status).toBe("switching");

    // One tick short of the window: still pending, still disabled.
    await vi.advanceTimersByTimeAsync(PAGE_SWITCH_WINDOW_MS - 1);
    expect(target.status).toBe("switching");
    expect(target.canApply()).toBe(false);

    // The window closes with no report. UNVERIFIED - not switched, not
    // failed. `reported` is still what the module last said, `requested` is
    // still what was asked for, and the gate is shut.
    await vi.advanceTimersByTimeAsync(1);
    expect(target.status).toBe("unverified");
    expect(target.status).not.toBe("switched");
    expect(target.status).not.toBe("reported");
    expect(target.reported).toBe(ACTIVE_PAGE);
    expect(target.requested).toBe(OTHER_PAGE);
    expect(target.canApply()).toBe(false);

    // A report of another page while unverified: recorded, still unverified.
    // The line keeps saying what is known until the visitor or the module decides.
    target.observeReport(ACTIVE_PAGE);
    expect(target.status).toBe("unverified");
    expect(target.canApply()).toBe(false);

    // The late confirmation: the module's own report of the requested page.
    target.observeReport(OTHER_PAGE);
    expect(target.status).toBe("reported");
    expect(target.canApply()).toBe(true);

    // And the second timer that never existed: advancing the clock again
    // changes nothing, because the report cleared the one timer there was.
    await vi.advanceTimersByTimeAsync(PAGE_SWITCH_WINDOW_MS * 2);
    expect(target.status).toBe("reported");

    expect(views.map((v) => v.status)).toEqual([
      "reported",
      "requested",
      "switching",
      "unverified",
      "reported",
    ]);

    // The visitor's own way out of `unverified`: the negative takes the
    // target back to the reported page and sends nothing.
    const second = rig();
    second.target.request(OTHER_PAGE);
    await second.target.confirm(second.queue, P, ADDRESS);
    const sentBefore = second.transport.writes.length;
    await vi.advanceTimersByTimeAsync(PAGE_SWITCH_WINDOW_MS);
    expect(second.target.status).toBe("unverified");
    second.target.cancel();
    expect(second.target.status).toBe("reported");
    expect(second.target.requested).toBe(ACTIVE_PAGE);
    expect(second.target.canApply()).toBe(true);
    expect(second.transport.writes.length, "a cancel sends nothing").toBe(
      sentBefore,
    );
    // But not while a switch is in flight: the wire cannot be unsent.
    second.target.request(OTHER_PAGE);
    await second.target.confirm(second.queue, P, ADDRESS);
    second.target.cancel();
    expect(second.target.status).toBe("switching");
  });

  it("the page list comes from the module's PAGECOUNT answer: a module answering 2 offers two pages, not four, and the file names no count of its own", async () => {
    // The fake's default is firmware's initial value and is named in ONE
    // place, synthetic.ts; a module that answers otherwise is offered as it
    // answers. The number the plan forbids is asserted absent from the
    // shipped module's source, comments included.
    const two = rig({ pageCount: 2 });
    expect(await two.target.enumerate(two.queue, P, ADDRESS)).toBe(2);
    expect(two.target.pages).toEqual([0, 1]);
    expect(two.target.pages).not.toHaveLength(4);
    expect(classNames(written(two.transport))).toEqual(["PAGECOUNT/FETCH"]);
    expect(
      Number(written(two.transport)[0].brc_parameters.DX),
      "addressed, not broadcast",
    ).toBe(0);

    const seven = rig({ pageCount: 7 });
    expect(await seven.target.enumerate(seven.queue, P, ADDRESS)).toBe(7);
    expect(seven.target.pages).toEqual([0, 1, 2, 3, 4, 5, 6]);

    // A module that does not answer: the list stays empty and nothing throws.
    // The queue's bounded attempts are the whole wait.
    const silent = rig();
    await silent.transport.close();
    expect(await silent.target.enumerate(silent.queue, P, ADDRESS)).toBe(0);
    expect(silent.target.pages).toEqual([]);

    // The mirror published the list as one value.
    expect(two.views.at(-1)?.pages).toEqual([0, 1]);

    // The shipped module never writes the number four as a page count. The
    // scan is over the whole source, comments included: the word is
    // permitted ("four states"), the digit as a count is not.
    const source = readFileSync(
      fileURLToPath(new URL("./page-target.ts", import.meta.url)),
      "utf8",
    );
    expect(source.length).toBeGreaterThan(1000);
    expect(source, "a hard-coded page count").not.toMatch(/\b4\b/);
    expect(source).not.toMatch(/length:\s*4/);
    expect(source).not.toMatch(/\[0,\s*1,\s*2,\s*3\]/);
  });
});
