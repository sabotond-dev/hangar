// The ambient-motion preference: the SCREEN switch's one surviving purpose (13-04, D-09) - a visitor
// whose operating system does not ask for less motion, but who does not want thirty pads moving
// while they read (Bible 14, 6). This module is the control's state; MotionControl.svelte is its face.
// Additive to prefers-reduced-motion, never subtractive: motionDeps() is the host's `reducedMotion`
// dependency and reports `os || still`, so the OS's true can never become false here; host.ts is read
// and not edited. The key, the two words and the guard live in src/lib/store/ since 13-06; what stays
// here is storage(), the one line on the motion path that names the browser store. The recorded
// choice is read ONCE at module scope, before hydration, so a visitor who chose still never watches
// the wall start and stop; the OS half is subscribed to inside motionDeps() (IDENT-02).
// Decided at 13-04 / 13-06 (13-CONTEXT D-09); see .planning/phases/13-gui-overhaul/13-06-SUMMARY.md
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  MOTION_CHOICES,
  MOTION_KEY,
  readMotion,
  writeMotion,
  type MotionChoice,
} from "../store/motion";
import type { HostDeps } from "./host";

// Re-exported so the names 13-04 published still resolve from here.
export { MOTION_CHOICES, MOTION_KEY };
export type { MotionChoice };

/** The control's two strings, in D-05's register and ledgered in 13-COPY-NEW.md. */
export const MOTION_LABEL = "Keep previews still";
export const MOTION_EXPLANATION =
  "Cards hold one frame instead of animating. A pad still answers your finger, and your system’s reduced-motion setting always wins.";

/** The store, or undefined; the property ACCESS is inside the try (07-RESEARCH pitfall 9). The store modules take it as an argument. */
function storage(): Storage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

/** The recorded choice, or undefined for anything that is not one of the two. */
const recorded = (): MotionChoice | undefined => readMotion(storage());

/** Never throws. A preference that could not be written is still the live preference. */
const remember = (choice: MotionChoice): void => {
  writeMotion(storage(), choice);
};

/** The live choice, shared: `const` and a property, because Svelte cannot track a reassigned exported binding. */
export const motion = $state<{ choice: MotionChoice }>({ choice: "animated" });

if (typeof document !== "undefined") {
  motion.choice = recorded() ?? "animated";
}

/** Every injected host dependency listening for the preference to move; a plain array, nothing renders it. */
const listeners: Array<() => void> = [];

export function chooseMotion(choice: MotionChoice): void {
  motion.choice = choice;
  remember(choice);
  for (const notify of [...listeners]) notify();
}

/** The operating system's own answer, live; exported so the control shows itself checked and disabled when the OS has decided. */
export function osQuery(): MediaQueryList | undefined {
  if (typeof window === "undefined") return undefined;
  if (typeof window.matchMedia !== "function") return undefined;
  return window.matchMedia("(prefers-reduced-motion: reduce)");
}

/**
 * The host's `reducedMotion` dependency with this preference folded in: `os || still`, and nothing
 * else. Either changing re-reports the OR; host.ts ignores a report that did not change its value.
 */
export function motionDeps(): Pick<HostDeps, "reducedMotion"> {
  return {
    reducedMotion: (cb) => {
      const query = osQuery();
      const current = (): boolean =>
        (query?.matches ?? false) || motion.choice === "still";
      const notify = (): void => cb(current());
      query?.addEventListener("change", notify);
      listeners.push(notify);
      return {
        matches: current(),
        stop: () => {
          query?.removeEventListener("change", notify);
          const at = listeners.indexOf(notify);
          if (at >= 0) listeners.splice(at, 1);
        },
      };
    },
  };
}
