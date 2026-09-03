import { describe, expect, it } from "vitest";
import {
  CONFIG_MAX,
  EVENT_SETUP,
  EVENT_TIMER,
  PRINTABLE_ASCII,
  TOUCH_EVENTS,
} from "./constants";
import { canWriteBack, type FetchedEvent } from "./write-guard";

const defaultConfig = (event: number): string => {
  const entry = TOUCH_EVENTS.find((e) => e.value === event);
  if (!entry) throw new Error(`the touch element has no event ${event}`);
  return entry.defaultConfig;
};

const fetched = (
  label: "Setup" | "Timer",
  event: number,
  actionString: string | undefined,
): FetchedEvent => ({
  event,
  label,
  actionString,
  actionLength: actionString?.length,
});

const setup = (actionString: string | undefined) =>
  fetched("Setup", EVENT_SETUP, actionString);
const timer = (actionString: string | undefined) =>
  fetched("Timer", EVENT_TIMER, actionString);

const refusal = (events: FetchedEvent[]): string => {
  const result = canWriteBack(events);
  if (result.ok) throw new Error("expected a refusal");
  return result.reason;
};

describe("write-back guard (D-09)", () => {
  it("two trustworthy strings allow the write", () => {
    const events = [
      setup(defaultConfig(EVENT_SETUP)),
      timer(defaultConfig(EVENT_TIMER)),
    ];
    expect(canWriteBack(events)).toEqual({ ok: true });
  });

  it("an undefined config string is refused and the event named", () => {
    const reason = refusal([
      setup(undefined),
      timer(defaultConfig(EVENT_TIMER)),
    ]);
    expect(reason).toContain("Setup");
  });

  it("an empty config string is refused as the non-active-page shape", () => {
    // A failed fetch sends a NACK and then a REPORT with ACTIONLENGTH 0 and an
    // empty string, so this is the documented failure shape.
    const reason = refusal([
      setup(defaultConfig(EVENT_SETUP)),
      { event: EVENT_TIMER, label: "Timer", actionString: "", actionLength: 0 },
    ]);
    expect(reason).toContain("Timer");
    expect(reason).toContain("empty");
  });

  it("a config at the limit is refused", () => {
    const reason = refusal([setup("x".repeat(CONFIG_MAX))]);
    expect(reason).toContain(String(CONFIG_MAX));
  });

  it("a config one character under the limit is allowed", () => {
    expect(canWriteBack([setup("x".repeat(CONFIG_MAX - 1))])).toEqual({
      ok: true,
    });
  });

  it("a non-printable character is refused and its index named", () => {
    const config = "print('café')";
    const index = [...config].findIndex((ch) => !PRINTABLE_ASCII.test(ch));
    expect(index).toBeGreaterThan(0);
    expect(refusal([timer(config)])).toContain(`index ${index}`);
  });
});
