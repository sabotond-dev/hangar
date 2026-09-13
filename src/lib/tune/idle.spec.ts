// The prefetch shim, tested in node with no browser at all.
//
// The whole environment is injected (the src/lib/sim/host.ts defaultDeps
// pattern), so the Safari path - a runtime with no requestIdleCallback - is a
// case this suite can actually enter rather than a branch nobody exercises
// until an iPhone opens the site.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FALLBACK_DELAY_MS, IDLE_TIMEOUT_MS, onIdle } from "./idle";
import { stripComments } from "../../test-support/source";

const source = (file: string) =>
  readFileSync(new URL(file, import.meta.url), "utf8");

/** A browser that knows what idle means. */
const chromium = () => {
  const log = {
    idleOpts: [] as ({ timeout: number } | undefined)[],
    idleCancelled: [] as number[],
    timeoutDelays: [] as number[],
    timeoutsCleared: [] as unknown[],
    queued: undefined as undefined | (() => void),
  };
  return {
    log,
    env: {
      requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => {
        log.idleOpts.push(opts);
        log.queued = cb;
        return 7;
      },
      cancelIdleCallback: (handle: number) => {
        log.idleCancelled.push(handle);
      },
      setTimeout: (cb: () => void, ms: number) => {
        log.timeoutDelays.push(ms);
        log.queued = cb;
        return 42;
      },
      clearTimeout: ((handle: unknown) => {
        log.timeoutsCleared.push(handle);
      }) as (handle: never) => void,
    },
  };
};

/**
 * Safari. `requestIdleCallback` is passed EXPLICITLY as undefined rather than
 * omitted: onIdle defaults its environment from the globals, and a runtime that
 * happened to have the function would silently take the other branch and leave
 * this test proving nothing.
 */
const webkit = () => {
  const { log, env } = chromium();
  return {
    log,
    env: {
      ...env,
      requestIdleCallback: undefined,
      cancelIdleCallback: undefined,
    },
  };
};

describe("the formatter prefetch shim (src/lib/tune/idle.ts)", () => {
  it("uses requestIdleCallback with a two-second timeout where there is one", () => {
    const { log, env } = chromium();
    let ran = 0;

    onIdle(() => {
      ran += 1;
    }, env);

    expect(IDLE_TIMEOUT_MS).toBe(2000);
    expect(log.idleOpts).toEqual([{ timeout: IDLE_TIMEOUT_MS }]);
    expect(log.timeoutDelays, "the timer path was taken as well").toEqual([]);

    log.queued?.();
    expect(ran).toBe(1);
  });

  it("falls back to a short timer on a browser with no idea what idle means", () => {
    const { log, env } = webkit();
    let ran = 0;

    onIdle(() => {
      ran += 1;
    }, env);

    expect(FALLBACK_DELAY_MS).toBe(200);
    expect(log.timeoutDelays).toEqual([FALLBACK_DELAY_MS]);
    expect(log.idleOpts, "there was no idle callback to use").toEqual([]);

    log.queued?.();
    expect(ran, "the Safari path never ran the callback").toBe(1);
  });

  it("cancels on whichever path it took, and a second cancel is harmless", () => {
    const idle = chromium();
    let ranIdle = 0;
    const cancelIdle = onIdle(() => {
      ranIdle += 1;
    }, idle.env);

    cancelIdle();
    cancelIdle();
    expect(idle.log.idleCancelled).toEqual([7]);
    expect(idle.log.timeoutsCleared).toEqual([]);
    // A callback that fires anyway - the handle was already claimed, or the
    // browser was mid-flight - must not run the prefetch after a cancel.
    idle.log.queued?.();
    expect(ranIdle).toBe(0);

    const timer = webkit();
    let ranTimer = 0;
    const cancelTimer = onIdle(() => {
      ranTimer += 1;
    }, timer.env);

    cancelTimer();
    cancelTimer();
    expect(timer.log.timeoutsCleared).toEqual([42]);
    expect(timer.log.idleCancelled).toEqual([]);
    timer.log.queued?.();
    expect(ranTimer).toBe(0);

    const code = stripComments(source("./idle.ts"));
    expect(code, "the file was actually read").toContain(
      "export function onIdle",
    );
    expect(code).not.toContain('from "');
    expect(code).not.toContain("from '");
    expect(code).not.toContain("import(");
    expect(code).not.toContain("require(");
  });
});
