import { afterEach, describe, expect, it } from "vitest";
import {
  EVENT_SETUP,
  EVENT_TIMER,
  FrameScanner,
  TERMINATOR,
  ZONA_HWCFG,
  type DecodedClass,
  decodeFrame,
  fetchConfig,
  hostHeartbeat,
  sendConfig,
  storePage,
} from "$lib/protocol";
import type { CaptureStep } from "./capture";
import { FakeTransport } from "./fake";
import {
  configAckFrame,
  configNackFrame,
  configReportFrame,
  heartbeatFrame,
  zonaResponder,
} from "./fixtures/synthetic";
import { RequestQueue } from "./queue";

// The policy Phase 7 applies, restated rather than imported: it lives in the
// vendored BOTOR compiler at `src/` + `vendor/botor/` + `_pad.ts:3477`, and
// D-05 keeps the vendored tree off this surface, so the queue's rejection
// wording is pinned here by copy instead of by dependency. The path is spelled
// in fragments because queue.ts asserts that it imports nothing from there and
// a literal in this spec would read as a counterexample.
const TRANSIENT_WRITE = /interrupted|timeout|timed out|busy|no response/i;

const SETUP_CONFIG = "--[[@cb]]print(1)";
const TIMER_CONFIG = "--[[@cb]]print(2)";
const FIRMWARE = { major: 1, minor: 5, patch: 5 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function state() {
  return {
    sx: 0,
    sy: 0,
    activePage: 0,
    configs: { [EVENT_SETUP]: SETUP_CONFIG, [EVENT_TIMER]: TIMER_CONFIG },
  };
}

/** Read the BRC id back off the wire, the way the module does. */
function idOf(bytes: Uint8Array): number {
  const frame = [...bytes];
  if (frame[frame.length - 1] === TERMINATOR) frame.pop();
  const decoded = decodeFrame(frame);
  if (!decoded.ok) throw new Error("outbound frame did not decode");
  return Number(decoded.classes[0].brc_parameters.ID);
}

function classesOf(frame: number[]): DecodedClass[] {
  const decoded = decodeFrame(frame);
  if (!decoded.ok)
    throw new Error(`fixture frame did not decode: ${decoded.reason}`);
  return decoded.classes;
}

/** The frame pump the page owns in plan 03: chunks in, classes into the queue. */
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

/**
 * Wait until the queue has actually put a request's bytes on the transport.
 *
 * WHY THIS IS A POLL AND NOT A `sleep`. Three tests below used `await sleep(5)`
 * here, and 5 ms of wall clock is not 5 ms of scheduled CPU: on 2026-09-07, at
 * the Phase 9 gate, `a request is not complete until an acknowledgement arrives`
 * failed `npm run test:quick` with `the bytes went out: expected [] to have a
 * length of 1` whenever free memory fell to around 0.6 GB and two other specs
 * were saturating the pool. Nothing about the queue was wrong; the test had
 * written down a number of milliseconds where it meant a CONDITION.
 *
 * The deadline is generous on purpose. It is a ceiling that says "the write
 * never happened", not a budget: a queue that takes two seconds to write one
 * request is a real failure and this still catches it, with a message that names
 * what was being waited for.
 */
async function awaitWrite(
  transport: FakeTransport,
  count = 1,
  deadlineMs = 2000,
): Promise<void> {
  const started = Date.now();
  while (transport.writes.length < count) {
    if (Date.now() - started > deadlineMs) {
      throw new Error(
        `the bytes never went out: waited ${deadlineMs} ms for ${count} ` +
          `write(s) and saw ${transport.writes.length}`,
      );
    }
    await sleep(1);
  }
}

const PENDING: unique symbol = Symbol("pending");
/** Resolves to PENDING if the promise has not settled within a beat. */
async function settledYet<T>(p: Promise<T>): Promise<T | typeof PENDING> {
  return Promise.race<T | typeof PENDING>([p, sleep(15).then(() => PENDING)]);
}

/** The rejection reason, as an opaque value: the test decides what it must be. */
const rejectionOf = (p: Promise<unknown>): Promise<unknown> =>
  p.then(
    () => undefined,
    (err: unknown) => err,
  );

const messageOf = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

// Every rejected promise in this file is asserted on; this keeps a stray one
// from leaking into another test's unhandled-rejection assertion.
afterEach(async () => {
  await sleep(0);
});

describe("request queue", () => {
  it("a request is not complete until an acknowledgement arrives, never on a resolved write", async () => {
    // No responder at all: write() resolves, and nothing comes back.
    const transport = new FakeTransport({});
    const steps: CaptureStep[] = [];
    const queue = new RequestQueue(transport, {
      preSendDelayMs: 0,
      onStep: (s) => steps.push(s),
    });
    pump(transport, queue);

    const pending = queue.request(
      sendConfig(0, 0, 0, EVENT_TIMER, TIMER_CONFIG),
      "write-timer",
    );
    await awaitWrite(transport);
    expect(transport.writes, "the bytes went out").toHaveLength(1);
    expect(
      await settledYet(pending),
      "SAFE-07: a resolved write is not an installed step",
    ).toBe(PENDING);

    // Now the module answers, and only now is the step complete.
    for (const cls of classesOf(
      configAckFrame({ sx: 0, sy: 0, lastheader: idOf(transport.writes[0]) }),
    )) {
      queue.deliver(cls);
    }
    const settled = await pending;
    expect(settled.class_instr).toBe("ACKNOWLEDGE");
    expect(steps.map((s) => [s.id, s.outcome])).toEqual([
      ["write-timer", "ok"],
    ]);
  });

  it("one outstanding request: the second write waits for the first to settle", async () => {
    const transport = new FakeTransport({
      responder: zonaResponder(state()),
      faults: [
        {
          kind: "delay",
          match: { class_name: "CONFIG", class_instr: "REPORT" },
          byMs: 40,
        },
      ],
    });
    const queue = new RequestQueue(transport, { preSendDelayMs: 0 });
    pump(transport, queue);

    const first = queue.request(
      fetchConfig(0, 0, 0, EVENT_SETUP),
      "fetch-setup",
    );
    const second = queue.request(
      fetchConfig(0, 0, 0, EVENT_TIMER),
      "fetch-timer",
    );
    await sleep(20);
    expect(transport.writes, "the second is still queued").toHaveLength(1);

    const [a, b] = await Promise.all([first, second]);
    expect(
      transport.writes,
      "and goes out once the first settles",
    ).toHaveLength(2);
    expect(a.class_parameters.ACTIONSTRING).toBe(SETUP_CONFIG);
    expect(b.class_parameters.ACTIONSTRING).toBe(TIMER_CONFIG);
  });

  it("a dropped acknowledgement produces exactly three writes and then a named failure", async () => {
    const transport = new FakeTransport({
      responder: zonaResponder(state()),
      faults: [
        {
          kind: "drop",
          match: { class_name: "CONFIG", class_instr: "ACKNOWLEDGE" },
        },
      ],
    });
    const steps: CaptureStep[] = [];
    const queue = new RequestQueue(transport, {
      preSendDelayMs: 0,
      backoffMs: () => 5,
      onStep: (s) => steps.push(s),
    });
    pump(transport, queue);

    const write = sendConfig(0, 0, 0, EVENT_TIMER, TIMER_CONFIG);
    write.timeoutMs = 60;
    await expect(queue.request(write, "write-timer")).rejects.toThrow(
      /Timed out after 60 ms/,
    );
    // SAFE-09: bounded, and the absence of a fourth is the assertion that
    // matters. The desktop's unbounded recursion (engine.store.ts:337) would
    // pass the first half of this test and fail the second forever.
    expect(transport.writes, "exactly three attempts").toHaveLength(3);
    await sleep(90);
    expect(transport.writes, "and never a fourth").toHaveLength(3);
    expect(steps.map((s) => [s.id, s.outcome, s.attempts])).toEqual([
      ["write-timer", "timeout", 3],
    ]);
  });

  it("the deadline decides, not the arrival order", async () => {
    const build = (byMs: number) => {
      const transport = new FakeTransport({
        responder: zonaResponder(state()),
        faults: [
          {
            kind: "delay",
            match: { class_name: "CONFIG", class_instr: "REPORT" },
            byMs,
          },
        ],
      });
      // One attempt, so the slow arm rejects at its deadline instead of
      // spending two more of them proving the same thing.
      const queue = new RequestQueue(transport, {
        preSendDelayMs: 0,
        attempts: 1,
      });
      pump(transport, queue);
      const req = fetchConfig(0, 0, 0, EVENT_SETUP);
      req.timeoutMs = 200;
      return queue.request(req, "fetch-setup");
    };

    const inTime = await build(150);
    expect(inTime.class_parameters.ACTIONSTRING).toBe(SETUP_CONFIG);
    await expect(
      build(250),
      "50 ms past the deadline is a timeout",
    ).rejects.toThrow(/Timed out after 200 ms/);
  });

  it("a negative acknowledgement rejects after one write and is never retried", async () => {
    const transport = new FakeTransport({
      responder: (outbound, requestId) =>
        outbound.class_name === "CONFIG" && outbound.class_instr === "EXECUTE"
          ? [configNackFrame({ sx: 0, sy: 0, lastheader: requestId })]
          : [],
    });
    const steps: CaptureStep[] = [];
    const queue = new RequestQueue(transport, {
      preSendDelayMs: 0,
      onStep: (s) => steps.push(s),
    });
    pump(transport, queue);

    await expect(
      queue.request(
        sendConfig(0, 0, 0, EVENT_TIMER, TIMER_CONFIG),
        "write-timer",
      ),
    ).rejects.toThrow(/negative acknowledgement/);
    expect(transport.writes, "a refusal is not a dropped packet").toHaveLength(
      1,
    );
    expect(steps.map((s) => s.outcome)).toEqual(["nack"]);
  });

  it("a heartbeat arriving mid-wait never resolves the waiter", async () => {
    const transport = new FakeTransport({});
    const queue = new RequestQueue(transport, { preSendDelayMs: 0 });
    pump(transport, queue);

    const req = fetchConfig(0, 0, 0, EVENT_SETUP);
    req.timeoutMs = 2000;
    const pending = queue.request(req, "fetch-setup");
    await awaitWrite(transport);

    // Four of these a second arrive on a real link, and this one carries the
    // active page beside it - two classes, both offered to the waiter.
    for (const cls of classesOf(
      heartbeatFrame({
        sx: 0,
        sy: 0,
        type: 1,
        hwcfg: ZONA_HWCFG,
        activePage: 0,
        firmware: FIRMWARE,
      }),
    )) {
      queue.deliver(cls);
    }
    expect(await settledYet(pending), "still waiting").toBe(PENDING);

    for (const cls of classesOf(
      configReportFrame({
        sx: 0,
        sy: 0,
        page: 0,
        event: EVENT_SETUP,
        config: SETUP_CONFIG,
      }),
    )) {
      queue.deliver(cls);
    }
    expect((await pending).class_parameters.ACTIONSTRING).toBe(SETUP_CONFIG);
  });

  it("a disconnect mid-write rejects the pending waiter and leaves no unhandled rejection", async () => {
    const unhandled: unknown[] = [];
    const listener = (err: unknown) => unhandled.push(err);
    process.on("unhandledRejection", listener);
    try {
      const transport = new FakeTransport({
        responder: zonaResponder(state()),
        faults: [{ kind: "disconnect", afterTxFrames: 1 }],
      });
      const steps: CaptureStep[] = [];
      const queue = new RequestQueue(transport, {
        preSendDelayMs: 0,
        onStep: (s) => steps.push(s),
      });
      pump(transport, queue);

      const req = fetchConfig(0, 0, 0, EVENT_SETUP);
      req.timeoutMs = 5000;
      // The rejection must arrive at once, not after the 5 second deadline.
      const started = Date.now();
      await expect(queue.request(req, "fetch-setup")).rejects.toThrow(
        /interrupted/,
      );
      expect(Date.now() - started, "not a waited-out timeout").toBeLessThan(
        1000,
      );
      expect(steps.map((s) => s.outcome)).toEqual(["aborted"]);

      // The restore heartbeat has to be sendable after any error - but the
      // port really is gone, so this fails loudly rather than silently.
      await expect(
        queue.sendImmediate(hostHeartbeat(), "restore-page-change"),
      ).rejects.toThrow();

      await sleep(20);
      expect(unhandled, "nothing rejected into the void").toEqual([]);
    } finally {
      process.off("unhandledRejection", listener);
    }
  });

  it("every rejection carries the wording Phase 7's retry policy reads", async () => {
    const timedOut = new FakeTransport({});
    const timeoutQueue = new RequestQueue(timedOut, {
      preSendDelayMs: 0,
      attempts: 1,
    });
    pump(timedOut, timeoutQueue);
    const slow = storePage();
    slow.timeoutMs = 30;
    const timeoutError = await rejectionOf(timeoutQueue.request(slow, "store"));

    const dropped = new FakeTransport({});
    const abortQueue = new RequestQueue(dropped, { preSendDelayMs: 0 });
    pump(dropped, abortQueue);
    const abortReq = fetchConfig(0, 0, 0, EVENT_SETUP);
    abortReq.timeoutMs = 5000;
    const abortPromise = rejectionOf(
      abortQueue.request(abortReq, "fetch-setup"),
    );
    await awaitWrite(dropped);
    abortQueue.abort("the ZONA was unplugged");
    const abortError = await abortPromise;

    const refused = new FakeTransport({
      responder: (outbound, requestId) =>
        outbound.class_instr === "EXECUTE"
          ? [configNackFrame({ sx: 0, sy: 0, lastheader: requestId })]
          : [],
    });
    const nackQueue = new RequestQueue(refused, { preSendDelayMs: 0 });
    pump(refused, nackQueue);
    const nackError = await rejectionOf(
      nackQueue.request(
        sendConfig(0, 0, 0, EVENT_TIMER, TIMER_CONFIG),
        "write-timer",
      ),
    );

    // Real Error instances, never the plain { value, text, type } objects the
    // desktop runtime rejects with.
    for (const error of [timeoutError, abortError, nackError]) {
      expect(error).toBeInstanceOf(Error);
    }
    expect(messageOf(timeoutError), "a timeout is worth retrying").toMatch(
      TRANSIENT_WRITE,
    );
    expect(messageOf(abortError), "so is an interrupted wait").toMatch(
      TRANSIENT_WRITE,
    );
    // And the one that must NOT be: firmware NACKs a CONFIG/EXECUTE only for
    // deterministic reasons - bad ACTIONLENGTH, wrong page, unknown element
    // (grid_decode.c:1260-1313). Retrying a refusal retries the mistake, which
    // is why the queue never retries a NACK and why its wording is kept out of
    // the transient pattern on purpose.
    expect(messageOf(nackError), "a refusal is not transient").not.toMatch(
      TRANSIENT_WRITE,
    );
  });
});
