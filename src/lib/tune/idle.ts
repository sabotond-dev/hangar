// One browser shim: run something when the page is idle, on every browser.
//
// THIS MODULE IMPORTS NOTHING, for the reason at the head of
// src/lib/tune/view.ts - a component may name it, so it must be free of the
// compiler and of everything that drags the protocol chunk onto first paint.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** Whatever the environment's timer returns: a number, or a node Timeout. */
export type TimerHandle = unknown;

/**
 * Everything onIdle needs from a browser, so it is testable in node.
 *
 * `clearTimeout` takes `never` on purpose and it is not a mistake: it is the
 * one parameter type that a browser's `clearTimeout(number)` and node's
 * `clearTimeout(Timeout)` are BOTH assignable to, because function parameters
 * are contravariant. The call site casts it back once, below, with the handle
 * its own `setTimeout` produced - which is the only handle it can ever be
 * given.
 */
export type IdleEnv = {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout: (cb: () => void, ms: number) => TimerHandle;
  clearTimeout: (handle: never) => void;
};

/** How long the browser may sit on the callback before it is forced through. */
export const IDLE_TIMEOUT_MS = 2000;

/** The Safari path's delay: long enough to be after first paint, short enough to be before the first click. */
export const FALLBACK_DELAY_MS = 200;

type ClearTimer = (handle: TimerHandle) => void;

const noop = () => {};

/**
 * The environment from the globals, each capability guarded, so this module can
 * be imported in a node test with none of them present.
 * src/lib/sim/host.ts's `defaultDeps()` is the shape.
 */
function defaultEnv(): IdleEnv {
  const scope = globalThis as unknown as {
    requestIdleCallback?: (
      cb: () => void,
      opts?: { timeout: number },
    ) => number;
    cancelIdleCallback?: (handle: number) => void;
    setTimeout?: (cb: () => void, ms: number) => TimerHandle;
    clearTimeout?: ClearTimer;
  };
  const request = scope.requestIdleCallback;
  const cancel = scope.cancelIdleCallback;
  const timer = scope.setTimeout;
  const clear = scope.clearTimeout;

  return {
    requestIdleCallback:
      typeof request === "function"
        ? (cb, opts) => request(cb, opts)
        : undefined,
    cancelIdleCallback:
      typeof cancel === "function" ? (handle) => cancel(handle) : undefined,
    setTimeout:
      typeof timer === "function" ? (cb, ms) => timer(cb, ms) : () => undefined,
    clearTimeout: ((handle: TimerHandle) => {
      if (typeof clear === "function") clear(handle);
    }) as (handle: never) => void,
  };
}

/**
 * Run `fn` when the browser is idle, or shortly, on a browser that has no idea
 * what idle means. Returns a cancel that is safe to call twice.
 *
 * requestIdleCallback is NOT available in Safari stable - WebKit ships it
 * behind a feature flag only, and MDN records it as not Baseline for that
 * reason. D-08 prefetches the 628 KB formatter on idle; without this fallback
 * an iOS visitor pays the whole download at the moment they open the tuning
 * panel, which is exactly the wait D-08 exists to remove.
 *
 * The cancelled flag guards the callback itself and not only the handle: a
 * request already in flight can still fire after `cancelIdleCallback`, and a
 * prefetch that starts after the panel closed is work nobody asked for.
 */
export function onIdle(fn: () => void, env?: Partial<IdleEnv>): () => void {
  const it: IdleEnv = { ...defaultEnv(), ...env };
  let cancelled = false;
  const run = () => {
    if (!cancelled) fn();
  };

  const request = it.requestIdleCallback;
  if (typeof request === "function") {
    const handle = request(run, { timeout: IDLE_TIMEOUT_MS });
    const cancel = it.cancelIdleCallback;
    return () => {
      if (cancelled) return;
      cancelled = true;
      if (typeof cancel === "function") cancel(handle);
    };
  }

  const handle = it.setTimeout(run, FALLBACK_DELAY_MS);
  const clear = (it.clearTimeout ?? noop) as ClearTimer;
  return () => {
    if (cancelled) return;
    cancelled = true;
    clear(handle);
  };
}
