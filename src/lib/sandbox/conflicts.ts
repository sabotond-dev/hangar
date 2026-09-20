// The shared-controller pass (change 13C, BENCH-2026-09-16.txt section 13, suggestion 12): two
// elements that send the same controller number on the same channel. Pure, on the regions: what
// each region SENDS is read off the same fields the emitter reads (model.ts) - a fader, a knob and
// a CC button their controller; an XY pad both axes for every finger (`cc + 2(n-1)`,
// `cc2 + 2(n-1)`); a note button and a blank nothing, a note is not a controller. A pair is
// reported once per shared (channel, controller), in the surface's order, never refused: the
// user may want two elements on one controller. The inspector lists the pairs, the plate marks
// the members.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  fingerController,
  isPaintOnly,
  outputOf,
  touchesOf,
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

/** The controller numbers a region sends, in finger order; empty for a blank or a note button. */
export function controllersOf(region: Region): readonly number[] {
  if (isPaintOnly(region)) return [];
  if (region.kind === "button") {
    return outputOf(region) === "note" ? [] : [region.cc];
  }
  if (region.kind !== "xy") return [region.cc];
  const out: number[] = [];
  for (let finger = 1; finger <= touchesOf(region); finger += 1) {
    out.push(fingerController(region.cc, finger));
    out.push(fingerController(region.cc2 ?? 0, finger));
  }
  return out;
}

/** Every pair sharing a (channel, controller), each pair once per shared controller, in the surface's order. */
export function findConflicts(regions: readonly Region[]): readonly Conflict[] {
  const sends = regions.map((r) => new Set(controllersOf(r)));
  const out: Conflict[] = [];
  for (let i = 0; i < regions.length; i += 1) {
    for (let j = i + 1; j < regions.length; j += 1) {
      if (regions[i].channel !== regions[j].channel) continue;
      for (const cc of sends[i]) {
        if (!sends[j].has(cc)) continue;
        out.push({
          aId: regions[i].id,
          bId: regions[j].id,
          a: regions[i].name,
          b: regions[j].name,
          cc,
          channel: regions[i].channel,
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
