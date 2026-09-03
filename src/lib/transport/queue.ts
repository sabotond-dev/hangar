// RequestQueue: the five invariants of grid-editor's write path, none of its
// machinery (ARCHITECTURE 1.7).
//
// Location note for Phase 6: ARCHITECTURE 3.3 puts this under device/, beside
// the session. It lives in transport/ this phase because device/ does not exist
// yet and this file depends only on GridTransport plus the pure matcher.
// Moving it is Phase 6's call - a decision, not a drift.
//
// The one thing this file must never grow is the desktop's serialisation
// strategy: a module-global waiter polled by a `while` + `await sleep(1)` loop
// (engine.store.ts:170, :357-370). A background tab clamps timers to 1 Hz, so
// that poll becomes one second per iteration (PITFALLS C11). A promise chain
// costs nothing and cannot be throttled.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  PRE_SEND_DELAY_MS,
  RETRY_ATTEMPTS,
  TIMEOUTS,
  type DecodedClass,
  type GridRequest,
  type ResponseFilter,
  encodeRequest,
  matchResponse,
  retryBackoffMs,
} from "$lib/protocol";
import type { CaptureStep, StepId } from "./capture";
import type { GridTransport } from "./transport";

/**
 * The module refused. Never retried: firmware NACKs a CONFIG/EXECUTE only for
 * deterministic reasons - an ACTIONLENGTH that does not land on the ETX, a
 * page that is not the active one, an element that does not exist
 * (grid_decode.c:1260-1313). Retrying a refusal retries the mistake.
 */
export class NackError extends Error {}

/** The wait ended because the link did, or because something stopped it. */
export class AbortedError extends Error {}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const asError = (err: unknown): Error =>
  err instanceof Error ? err : new Error(String(err));

interface Waiter {
  filter: ResponseFilter;
  className: string;
  expectedId: number | undefined;
  startedAt: number;
  timeoutMs: number;
  timer: ReturnType<typeof setTimeout> | undefined;
  promise: Promise<DecodedClass>;
  resolve: (cls: DecodedClass) => void;
  reject: (err: Error) => void;
  settled: boolean;
}

export interface QueueOptions {
  /** Default PRE_SEND_DELAY_MS (10). The A/B arm sets it to 0. */
  preSendDelayMs?: number;
  /** Default RETRY_ATTEMPTS (3). Total writes, not extra ones. */
  attempts?: number;
  backoffMs?: (attempt: number) => number;
  now?: () => number;
  onStep?: (step: CaptureStep) => void;
}

export class RequestQueue {
  private readonly transport: GridTransport;
  private readonly preSendDelayMs: number;
  private readonly attempts: number;
  private readonly backoffMs: (attempt: number) => number;
  private readonly now: () => number;
  private readonly onStep: ((step: CaptureStep) => void) | undefined;
  /** One outstanding request: a promise chain, never a poll. */
  private chain: Promise<unknown> = Promise.resolve();
  private waiter: Waiter | undefined;
  private writeInFlight = false;
  private abortedReason: string | undefined;

  constructor(transport: GridTransport, opts: QueueOptions = {}) {
    this.transport = transport;
    this.preSendDelayMs = opts.preSendDelayMs ?? PRE_SEND_DELAY_MS;
    this.attempts = opts.attempts ?? RETRY_ATTEMPTS;
    this.backoffMs = opts.backoffMs ?? retryBackoffMs;
    this.now = opts.now ?? (() => performance.now());
    this.onStep = opts.onStep;
  }

  /**
   * Enqueued, one outstanding at a time. Resolves on a matching response only -
   * a resolved `write()` means the bytes left, and nothing more (SAFE-07).
   *
   * `stepId` is the pinned StepId this request reports under, so the capture,
   * the page's status list and plan 05's gate all name the same thing.
   */
  request(req: GridRequest, stepId: StepId): Promise<DecodedClass> {
    const run = () => this.runRequest(req, stepId);
    const next = this.chain.then(run, run);
    // The chain must never carry a rejection forward: one failed request would
    // otherwise reject everything queued behind it, and the chain's own tail
    // would surface as an unhandled rejection nobody ever awaits.
    this.chain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  /**
   * Fire and forget. Jumps the queue, never waits for a response, and works
   * both while a request is outstanding and after `abort()` - because the
   * restore heartbeat has to be sendable after any error.
   */
  async sendImmediate(req: GridRequest, stepId: StepId): Promise<void> {
    const descr = describe(req);
    if (this.writeInFlight) {
      // Dropped rather than queued, mirroring SendHeartbeatImmediate.executeOn
      // (instructions.ts:52-60). Queueing it behind a write is the one thing it
      // must not do; a heartbeat that arrives late is worse than none.
      this.emit({
        id: stepId,
        descr,
        attempts: 0,
        outcome: "aborted",
        error: "dropped: a write was already in flight",
      });
      return;
    }
    const { bytes, id } = encodeRequest(req);
    const sentAt = this.now();
    this.writeInFlight = true;
    try {
      await this.transport.write(bytes);
    } catch (err) {
      const error = asError(err);
      this.emit({
        id: stepId,
        descr,
        requestId: id,
        sentAt,
        attempts: 1,
        outcome: "aborted",
        error: error.message,
      });
      throw error;
    } finally {
      this.writeInFlight = false;
    }
    this.emit({
      id: stepId,
      descr,
      requestId: id,
      sentAt,
      settledAt: this.now(),
      attempts: 1,
      outcome: "sent",
    });
  }

  /** Called by the frame pump for every decoded class in every frame. */
  deliver(cls: DecodedClass): void {
    const waiter = this.waiter;
    if (!waiter) return;
    // matchResponse rejects a HEARTBEAT before it looks at anything else. This
    // must not shortcut around it: a module heartbeats four times a second and
    // would satisfy a loose filter long before the real response arrived.
    const result = matchResponse(cls, waiter.filter, waiter.expectedId);
    if (result === "no") return;
    if (result === "nack") {
      this.settle(waiter, () =>
        waiter.reject(
          new NackError(
            `${waiter.className} was refused by the module (negative acknowledgement)`,
          ),
        ),
      );
      return;
    }
    this.settle(waiter, () => waiter.resolve(cls));
  }

  /** Disconnect. Rejects the pending waiter with a named error and drains. */
  abort(reason: string): void {
    this.abortedReason = reason;
    const waiter = this.waiter;
    if (!waiter) return;
    this.settle(waiter, () =>
      waiter.reject(
        new AbortedError(`Waiting for response was interrupted (${reason})`),
      ),
    );
  }

  private async runRequest(
    req: GridRequest,
    stepId: StepId,
  ): Promise<DecodedClass> {
    const descr = describe(req);
    if (this.abortedReason !== undefined) {
      // Drained: everything queued behind a disconnect fails fast with the
      // same named error rather than each waiting out its own deadline.
      const error = new AbortedError(
        `Waiting for response was interrupted (${this.abortedReason})`,
      );
      this.emit({
        id: stepId,
        descr,
        attempts: 0,
        outcome: "aborted",
        error: error.message,
      });
      throw error;
    }
    const filter = req.filter;
    if (!filter) {
      throw new Error(
        `${req.label} declares no response filter; use sendImmediate for a fire-and-forget send`,
      );
    }
    const timeoutMs = req.timeoutMs ?? TIMEOUTS.executeMs;
    const matchedOn = [
      "class",
      "instr",
      ...Object.keys(filter.brc_parameters ?? {}),
      ...Object.keys(filter.class_parameters ?? {}),
      ...(req.correlateById ? ["LASTHEADER"] : []),
    ];
    const sentAt = this.now();
    let requestId: number | undefined;
    let lastError: Error = new Error(`${req.label} never ran`);

    for (let attempt = 1; attempt <= this.attempts; attempt++) {
      // The desktop's undocumented pre-send sleep (engine.store.ts:372), made
      // configurable so the A/B arm can set it to 0 and measure.
      await sleep(this.preSendDelayMs);
      const encoded = encodeRequest(req);
      requestId = encoded.id;
      // The id is captured BEFORE the write and applied only where firmware
      // echoes it - correlateById is true for the write and the store, and
      // false for a fetch, whose REPORT carries the protocol major in those
      // same two bytes.
      const waiter = this.arm(
        filter,
        req.descr.class_name,
        req.correlateById ? encoded.id : undefined,
        timeoutMs,
      );
      try {
        this.writeInFlight = true;
        await this.transport.write(encoded.bytes);
      } catch (err) {
        const error = asError(err);
        this.settle(waiter, () => waiter.reject(error));
        this.emit({
          id: stepId,
          descr,
          requestId,
          sentAt,
          settledAt: this.now(),
          attempts: attempt,
          outcome: "aborted",
          error: error.message,
        });
        throw error;
      } finally {
        this.writeInFlight = false;
      }

      try {
        const cls = await waiter.promise;
        const settledAt = this.now();
        this.emit({
          id: stepId,
          descr,
          requestId,
          sentAt,
          settledAt,
          latencyMs: settledAt - sentAt,
          attempts: attempt,
          outcome: "ok",
          matchedOn,
        });
        return cls;
      } catch (err) {
        const error = asError(err);
        if (error instanceof NackError || error instanceof AbortedError) {
          // Neither is retried: one is a refusal, the other is a dead link.
          this.emit({
            id: stepId,
            descr,
            requestId,
            sentAt,
            settledAt: this.now(),
            attempts: attempt,
            outcome: error instanceof NackError ? "nack" : "aborted",
            error: error.message,
          });
          throw error;
        }
        lastError = error;
        if (attempt < this.attempts) await sleep(this.backoffMs(attempt - 1));
      }
    }

    // Bounded, and that is the whole point: the desktop retries by unbounded
    // recursion (engine.store.ts:337), so a module that never answers is a
    // process that never stops.
    this.emit({
      id: stepId,
      descr,
      requestId,
      sentAt,
      settledAt: this.now(),
      attempts: this.attempts,
      outcome: "timeout",
      error: lastError.message,
    });
    throw lastError;
  }

  private arm(
    filter: ResponseFilter,
    className: string,
    expectedId: number | undefined,
    timeoutMs: number,
  ): Waiter {
    let resolve!: (cls: DecodedClass) => void;
    let reject!: (err: Error) => void;
    const promise = new Promise<DecodedClass>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const waiter: Waiter = {
      filter,
      className,
      expectedId,
      startedAt: this.now(),
      timeoutMs,
      timer: undefined,
      promise,
      resolve,
      reject,
      settled: false,
    };
    // A disconnect can reject this before the caller reaches its await - the
    // transport's close callback runs synchronously inside write(). Marking the
    // promise handled here is what keeps that from surfacing as an unhandled
    // rejection; the real handler is still the await below.
    void promise.catch(() => undefined);

    const fire = () => {
      const elapsed = this.now() - waiter.startedAt;
      if (elapsed < waiter.timeoutMs) {
        // The deadline is the authority, never the timer's nominal duration. A
        // background tab clamps timers, so a fire is only a timeout if the
        // clock agrees; if it is short, re-arm for the remainder.
        waiter.timer = setTimeout(fire, waiter.timeoutMs - elapsed);
        return;
      }
      this.settle(waiter, () =>
        waiter.reject(
          new Error(
            `Timed out after ${timeoutMs} ms waiting for ${className} ${filter.class_instr}`,
          ),
        ),
      );
    };
    waiter.timer = setTimeout(fire, timeoutMs);
    this.waiter = waiter;
    return waiter;
  }

  private settle(waiter: Waiter, done: () => void): void {
    if (waiter.settled) return;
    waiter.settled = true;
    if (waiter.timer !== undefined) clearTimeout(waiter.timer);
    if (this.waiter === waiter) this.waiter = undefined;
    done();
  }

  private emit(step: CaptureStep): void {
    this.onStep?.(step);
  }
}

const describe = (req: GridRequest) =>
  `${req.descr.class_name}/${req.descr.class_instr}`;
