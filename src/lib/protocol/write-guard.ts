// D-09's refusal, as a pure function (FOUND-01).
//
// The walking skeleton's write is provable only when the string it writes back
// is the string the module already holds. If a fetch returned anything that
// cannot be trusted, the write buttons stay disabled and the page says which
// event failed and why.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import { CONFIG_MAX, PRINTABLE_ASCII } from "./constants";

export interface FetchedEvent {
  event: number;
  /**
   * The word a refusal names. "System" joined the two in Phase 12 (12-02):
   * the system element's setup is a third fetched string, and a guard sentence
   * that called it "Setup" would send a visitor looking at the wrong slot.
   * "System timer" joined in Phase 12.1 (12.1-06, D-03): the system element's
   * timer is the fourth; "System utility" in Phase 13 (13-17, D-18 / D-19):
   * the same element's utility event is the fifth, and sequence.ts's SLOTS is
   * where each label is paired with its element and event. The page's own copy words are
   * install-copy.ts's separate `EventWord`, which 12-03 moves with the
   * classifier; nothing switches exhaustively on this one.
   */
  label: "System timer" | "System" | "System utility" | "Setup" | "Timer";
  actionString: string | undefined;
  actionLength: number | undefined;
}

export type WriteGuard = { ok: true } | { ok: false; reason: string };

/**
 * Decide whether the fetched strings are trustworthy enough to write back.
 * Returns the first failure, so the page names one reason rather than a list.
 */
export function canWriteBack(fetched: FetchedEvent[]): WriteGuard {
  for (const { label, actionString, actionLength } of fetched) {
    if (actionString === undefined) {
      return {
        ok: false,
        reason: `${label} fetch returned no config string, so a write cannot be proved a no-op`,
      };
    }
    if (actionString === "" || actionLength === 0) {
      // Not paranoia: when a recall fails, firmware sends a NACK and then falls
      // through and sends the REPORT anyway, with ACTIONLENGTH 0 and the zeroed
      // buffer (grid_decode.c:1315-1360, grid_ui.c:464-501). An empty string is
      // exactly the shape a fetch of a non-active page produces - and since
      // Phase 13, plan 13-12, the CAUSE of that shape is addressed upstream
      // rather than only caught here: the page target (page-target.ts) follows
      // the page the module REPORTS, every fetch and write is addressed to it,
      // and a switch is confirmed by the module's own report before anything
      // is fetched or written on the new page. This refusal is now the
      // backstop for the case that cannot be ruled out by construction - the
      // module changing page under HANGAR between a report and a fetch - and
      // it stays, because a backstop that was never needed costs nothing and
      // one that was removed costs a write to the wrong page.
      return {
        ok: false,
        reason: `${label} fetch returned an empty config string - the shape a fetch of a non-active page produces`,
      };
    }
    if (actionString.length >= CONFIG_MAX) {
      return {
        ok: false,
        reason: `${label} is ${actionString.length} characters; the module's limit is ${CONFIG_MAX}`,
      };
    }
    if (!PRINTABLE_ASCII.test(actionString)) {
      const i = [...actionString].findIndex((ch) => !PRINTABLE_ASCII.test(ch));
      return {
        ok: false,
        reason: `${label} has a non-printable character at index ${i}`,
      };
    }
  }
  return { ok: true };
}

/**
 * Decide whether the fetched strings are a real copy of what the module holds
 * (change 23, BENCH-2026-09-16.txt section 23). The install store's copy of a
 * page is a courtesy, never a write's precondition, and it is not a write-back
 * either, so it asks less than canWriteBack: a string came back, and it is not
 * the empty shape a refused fetch produces (a page that is not the active one,
 * or a fetch during a page load: grid_ui.c:466-474 refuses, grid_decode.c
 * :1318-1360 sends a NACK and then the REPORT with ACTIONLENGTH 0). Anything
 * else the module answered is what it holds, and is copied as it came: a
 * configuration the Grid Editor stored carries a line break wherever a Code
 * block had a `--` comment (the pinned minifier keeps the comment and its line
 * break) and may carry a tab, and nothing but the length stops the Editor
 * sending either (instructions.ts:163-173). canWriteBack's printable rule
 * refused exactly those pages.
 */
export function canCopy(fetched: FetchedEvent[]): WriteGuard {
  for (const { label, actionString, actionLength } of fetched) {
    if (actionString === undefined) {
      return {
        ok: false,
        reason: `${label} fetch returned no config string`,
      };
    }
    if (actionString === "" || actionLength === 0) {
      return {
        ok: false,
        reason: `${label} fetch returned an empty config string - the shape a refused fetch produces`,
      };
    }
  }
  return { ok: true };
}
