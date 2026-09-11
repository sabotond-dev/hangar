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
   * that called it "Setup" would send a visitor looking at the wrong slot. The
   * page's own copy words are install-copy.ts's separate `EventWord`, which
   * 12-03 moves with the classifier; nothing switches exhaustively on this one.
   */
  label: "System" | "Setup" | "Timer";
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
