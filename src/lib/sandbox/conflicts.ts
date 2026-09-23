// The shared-controller pass (change 13C, BENCH-2026-09-16.txt section 13, suggestion 12): two
// elements that send the same controller number on the same channel. Pure, on the regions: what
// each region SENDS is read off the same fields the emitter reads (model.ts) - a fader, a knob and
// a CC button their controller; an XY pad both axes for every finger (`cc + 2(n-1)`,
// `cc2 + 2(n-1)`), the Y axis on its own channel (change 17); a note button, an output typed
// a pitch bend or a channel pressure (change 17) and a blank nothing - none is a controller. A pair
// is reported once per shared (channel, controller), in the surface's order, never refused.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  channelYOf,
  fingerController,
  isPaintOnly,
  touchesOf,
  typeOf,
  typeYOf,
  type Region,
} from "./model";

/** Two elements on one controller and channel, by id and by name, `a` before `b` in the surface's order. */
export type Conflict = {
  readonly aId: string;
  readonly bId: string;
  readonly a: string;
  readonly b: string;
  readonly cc: number;
  readonly channel: number;
};

/** One controller a region sends: its channel (1..16) and its number. */
export type Controller = { readonly channel: number; readonly cc: number };

/** The controllers a region sends, in finger order (an XY pad's X then Y per finger); empty for a blank, a note button, a pitch bend or a channel pressure. */
export function sendsOf(region: Region): readonly Controller[] {
  if (isPaintOnly(region)) return [];
  if (region.kind !== "xy")
    return typeOf(region) === "cc"
      ? [{ channel: region.channel, cc: region.cc }]
      : [];
  const out: Controller[] = [];
  for (let finger = 1; finger <= touchesOf(region); finger += 1) {
    if (typeOf(region) === "cc")
      out.push({
        channel: region.channel,
        cc: fingerController(region.cc, finger),
      });
    if (typeYOf(region) === "cc")
      out.push({
        channel: channelYOf(region),
        cc: fingerController(region.cc2 ?? 0, finger),
      });
  }
  return out;
}

/** The controller numbers a region sends, in finger order (`sendsOf` without the channels). */
export function controllersOf(region: Region): readonly number[] {
  return sendsOf(region).map((c) => c.cc);
}

/** Every pair sharing a (channel, controller), each pair once per shared controller, in the surface's order. */
export function findConflicts(regions: readonly Region[]): readonly Conflict[] {
  const key = (c: Controller): string => `${c.channel}:${c.cc}`;
  const sends = regions.map((r) => sendsOf(r));
  const keys = sends.map((s) => new Set(s.map(key)));
  const out: Conflict[] = [];
  for (let i = 0; i < regions.length; i += 1) {
    for (let j = i + 1; j < regions.length; j += 1) {
      const seen = new Set<string>();
      for (const c of sends[i]) {
        const k = key(c);
        if (seen.has(k) || !keys[j].has(k)) continue;
        seen.add(k);
        out.push({
          aId: regions[i].id,
          bId: regions[j].id,
          a: regions[i].name,
          b: regions[j].name,
          cc: c.cc,
          channel: c.channel,
        });
      }
    }
  }
  return out;
}

/** The ids of every member of a conflict, for the plate's marks. */
export function conflictedIds(
  conflicts: readonly Conflict[],
): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const c of conflicts) {
    ids.add(c.aId);
    ids.add(c.bId);
  }
  return ids;
}
