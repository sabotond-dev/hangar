// The trimmed library (change 10B, answer 12): the two system halves a SANDBOX landing writes in
// place of `TOUCH_LIBRARY` / `TOUCH_LIBRARY_TIMER`, sliced from library.ts's exported parts by
// name - never a second copy of the Lua. 255/0 keeps the head, the map, `U X N` and the join
// call (what the runtime calls; `E` is the runtime's own since change 17 - a surface never makes
// the `H` or `B` entries the library's clears); 255/6 keeps the marker alone: the runtime
// draws its own pictures with `glc` / `glp`, so `V G Z Y K A D` have no caller under a surface.
// The room the trim frees is the runtime's (runtime.ts `packRuntime` under five slots), and the
// names it retires are the runtime's to spend. A catalog entry's landing still writes the full
// halves: `library.ts` is untouched and its records are unmoved.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import {
  LIBRARY_PARTS,
  TOUCH_LIBRARY,
  TOUCH_LIBRARY_TIMER,
} from "../catalog/library";

/**
 * The head a trimmed 255/0 opens with (change 17): the marker, the two tables the kept `X` reads -
 * `T` the stamps, `C` the Timer's count - and the runtime's two contact tables `S F`, made fresh
 * on every landing before the touch Setup runs (runtime.ts `SETUP_STATE`). The library's head also
 * makes `H P B L`, which only the functions the trim drops read.
 */
export const TRIMMED_HEAD = "--[[@cb]]T={}C=0 S={}F={}";

/** The parts 255/0 keeps, by library.ts's names, in its order - behind `TRIMMED_HEAD`. */
export const TRIM_KEEPS_SETUP: readonly string[] = [
  "the map",
  "U",
  "X",
  "N",
  "the call",
];

/** The parts 255/6 keeps: the marker and nothing else. */
export const TRIM_KEEPS_TIMER: readonly string[] = ["marker"];

/** The names the trim retires from both halves - free for the runtime to define. */
export const TRIM_FREED_NAMES: readonly string[] = [
  "E",
  "W",
  "Q",
  "V",
  "G",
  "Z",
  "Y",
  "K",
  "A",
  "D",
];

function partNamed(name: string): string {
  const part = LIBRARY_PARTS.find((p) => p.name === name);
  if (part === undefined) throw new Error(`library.ts has no part "${name}"`);
  return part.lua;
}

/**
 * 255/0 trimmed, joined as library.ts joins the full string (the map and the
 * functions concatenated, the functions and the call space-joined; the head
 * ends in `}` since change 17, so it and the map need no space either) so
 * the text is the minifier's own fixed point - runtime.spec.ts proves it
 * canonical and runs it.
 */
export const TRIMMED_LIBRARY: string =
  TRIMMED_HEAD +
  partNamed("the map") +
  ["U", "X", "N"].map(partNamed).join(" ") +
  " " +
  partNamed("the call");

/** 255/6 trimmed: the nine-character marker. */
export const TRIMMED_LIBRARY_TIMER: string = partNamed("marker");

/** What the trim frees in each half, in characters. */
export const TRIM_FREES = {
  setup: TOUCH_LIBRARY.length - TRIMMED_LIBRARY.length,
  timer: TOUCH_LIBRARY_TIMER.length - TRIMMED_LIBRARY_TIMER.length,
} as const;

/** The globals the trimmed halves still define, read off the text as library.ts reads its own. */
export const TRIMMED_GLOBALS: readonly string[] = [
  ...new Set(
    [TRIMMED_LIBRARY, TRIMMED_LIBRARY_TIMER].flatMap((text) => [
      ...[...text.matchAll(/\bfunction\s+([A-Z]{1,2})\s*\(/g)].map((m) => m[1]),
      ...[...text.matchAll(/\b([A-Z]{1,2})=/g)].map((m) => m[1]),
    ]),
  ),
].sort();
