// The mirror's picture (change 20, docs/MIRROR.md sections 1 and 6): an engine the simulator host
// paints like any other, whose frame is written from the ZONA's own LED reports instead of a tick.
// Pure, and it imports nothing at runtime - the host's engine shape is a type - so the Playground's
// workspace can hold one without reaching the protocol package or the vendored simulator.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
import type { LedRecord } from "$lib/protocol/preview";
import type { HostEngine } from "$lib/sim/host";

/** The pad is nine by nine. */
export const MIRROR_SIDE = 9;
/** 81 cells, three bytes each, screen order - the frame every engine hands the painter. */
export const MIRROR_FRAME_BYTES = MIRROR_SIDE * MIRROR_SIDE * 3;

/**
 * The screen cell (row-major, cell 0 top-left) of one LED by its HARDWARE index. The strip is a
 * serpentine: firmware's logical-to-hardware table mirrors EVEN rows, row 0 reading 8, 7, ... 0
 * (grid_module.c:444-452). The same rule as the vendored simulator's hwToScreen, restated here so the
 * mirror does not import the simulator; mirror.spec.ts holds the two equal at all 81 indices.
 */
export function screenCellOfLed(num: number): number {
  const y = Math.floor(num / MIRROR_SIDE);
  const raw = num % MIRROR_SIDE;
  const x = y % 2 === 0 ? MIRROR_SIDE - 1 - raw : raw;
  return y * MIRROR_SIDE + x;
}

/** Write LED records into a screen-order frame; a record past the 81st cell is ignored. */
export function applyLedRecords(
  frame: Uint8Array,
  records: readonly LedRecord[],
): void {
  for (const { num, r, g, b } of records) {
    if (num < 0 || num >= MIRROR_SIDE * MIRROR_SIDE) continue;
    const at = screenCellOfLed(num) * 3;
    frame[at] = r;
    frame[at + 1] = g;
    frame[at + 2] = b;
  }
}

/**
 * The engine the host holds while the plate mirrors the ZONA. It never ticks, never animates on its
 * own and takes no finger - the fingers are on the module; `frame` is written by the mirror store
 * and the host is told through invalidate(). `reset()` keeps the picture: the host calls it to
 * still a card under reduced motion, and the module's lights are not the site's motion.
 */
export class MirrorEngine implements HostEngine {
  readonly frame = new Uint8Array(MIRROR_FRAME_BYTES);
  readonly animating = false;
  readonly coordMax = 127 as const;
  readonly pendingTouches = 0;

  /** Black, every cell: the picture before the first report. */
  clear(): void {
    this.frame.fill(0);
  }

  tick(): void {}
  run(): void {}
  reset(): void {}
  touchDown(): void {}
  touchMove(): void {}
  touchUp(): void {}
}
