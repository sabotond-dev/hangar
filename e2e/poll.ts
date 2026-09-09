// The guard that makes a Playwright poll's timeout real.
//
// EXPECT.POLL RETRIES A FAILING MATCHER AND NOT A THROWING CALLBACK, and this
// was read out of the shipped implementation rather than out of the
// documentation. node_modules/playwright/lib/matchers/expect.js,
// invokePollMatcher:
//
//     const value = await actual();            // OUTSIDE the try
//     try {
//       await callMatcherAsStep(...);          // inside it
//       return { continuePolling: false, ... };
//     } catch (error) {
//       return { continuePolling: true, result: error };
//     }
//
// So the matcher is retried and the callback is not. One transient exception
// anywhere in a thirty-second budget kills the test outright at the first
// attempt, which means the thirty seconds are illusory against the failure mode
// most likely to occur - and it is why two waves of summaries could only
// describe the shape of a flake rather than name its cause.
//
// The other half of that reading is what makes the positive shape below work:
// EVERY error thrown by the matcher is caught, including a usage error such as
// jest's "received value must be a number or bigint". So handing a string to
// .toBeGreaterThan(0) does not abort the poll - it continues it, and the string
// is what the final "Received:" line prints.
//
// TWO SHAPES, BECAUSE THE ELEVEN CALL SITES IN e2e/ ARE NOT HOMOGENEOUS.
//
//   guarded()    - for every .toBe / .toEqual / .toBeGreaterThan site. On a
//                  throw it returns a descriptive string carrying the error's
//                  own name, which no numeric or array matcher can match, so
//                  the poll keeps polling and the final message names the
//                  engine instead of an unattributed stack.
//
//   guardedNot() - for a NEGATED matcher, .not.toBe(was). A string sentinel
//                  there is a TRAP: a string is also not equal to `was`, so it
//                  would SATISFY THE NEGATION and turn the test green on a
//                  broken page. The inverted shape returns `was` itself, which
//                  fails the negation, so the poll keeps going; the last error
//                  is recorded so a trailing assertion can name it.
//
// There are two negated poll sites in this repository, not one:
// tuning.e2e.ts's remeasured() and tuning-webkit.e2e.ts's "the hero's own
// backing store changes between samples". Both take guardedNot.
//
// This module is NOT a test file. It carries no test( ) title, it is not
// matched by playwright.config.ts's testMatch ("**/*.e2e.ts"), and it is not in
// the vitest `server` project - so it moves neither the e2e total nor the quick
// file count. e2e/fake-serial.ts and e2e/fake-zona.ts are the same shape.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/**
 * The engine's own error, named. `instanceof Error` rather than a cast: a
 * rejection from page.evaluate arrives as a real Error with the page-side
 * name preserved in its message, and anything else is stringified rather than
 * silently reported as "undefined".
 */
function describeThrow(error: unknown, what: string): string {
  const name = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? error.message : String(error);
  return `poll guard [${what}]: the callback threw ${name}: ${message}`;
}

/**
 * The positive shape. Wrap a poll callback so a throw becomes a value the
 * matcher rejects, rather than an exception that ends the test.
 *
 * `what` is a short name for the thing being read; it is what the failure
 * message leads with, so make it the thing a reader would want to know first.
 */
export function guarded<T>(
  read: () => Promise<T>,
  what: string,
): () => Promise<T | string> {
  return async (): Promise<T | string> => {
    try {
      return await read();
    } catch (error) {
      return describeThrow(error, what);
    }
  };
}

/**
 * The inverted shape, for `.not.toBe(was)` and nothing else.
 *
 * On a throw it returns `was`, which FAILS the negation, so the poll keeps
 * going for its whole budget. Returning anything else - a string, null,
 * undefined - would pass the negation and report a broken page as a change.
 *
 * `lastError()` is the error most recently swallowed, or undefined if the
 * callback never threw, so the caller can assert on it after the poll and say
 * out loud what the page was doing.
 */
export function guardedNot<T>(
  read: () => Promise<T>,
  was: T,
  what: string,
): { read: () => Promise<T>; lastError: () => string | undefined } {
  let last: string | undefined;
  return {
    read: async (): Promise<T> => {
      try {
        return await read();
      } catch (error) {
        last = describeThrow(error, what);
        return was;
      }
    },
    lastError: (): string | undefined => last,
  };
}
