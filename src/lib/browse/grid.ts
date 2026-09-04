// The browse grid's arithmetic: how many columns, and where an arrow key goes.
//
// It imports nothing at all - not even a type. Everything it needs arrives as a
// number, which is what lets grid.spec.ts pin the whole keyboard model in node
// with no DOM. That separation is the house pattern, and
// src/lib/coverflow/slots.ts states the reason: this repository collects no
// .svelte.spec.ts in any Vitest project, so arithmetic written inside
// BrowseGrid.svelte would be untested and would LOOK tested.
//
// Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.

/** The card floor in the grid's own CSS: minmax(260px, 1fr). */
const MIN_CARD_PX = 260;
/** The grid's own gap. */
const GAP_PX = 24;
/**
 * There is never a fifth column. The content column caps at 1280px
 * (min(100vw - 2 x gutter, 1280px)), and a fifth 260px track plus its gap needs
 * 1396px, so the cap is what the layout does anyway - stating it here means a
 * caller that hands in a raw viewport width still gets an answer the screen can
 * show.
 */
const MAX_COLUMNS = 4;

/**
 * The column count for a CONTENT width - min(100vw - 2 x gutter, 1280px), not
 * the viewport width. Mirrors `repeat(auto-fill, minmax(260px, 1fr))` at 24px
 * gaps exactly: n columns fit when n * 260 + (n - 1) * 24 <= width, which is
 * the approved ladder in 05.1-UI-SPEC.md Screen 2b - 4 at 1112 and above, 3
 * from 828, 2 from 544, 1 below that.
 *
 * The COMPONENT reads the live count out of the rendered grid instead (see
 * columnsFromTemplate), because that is the one source that cannot disagree
 * with the screen. This function exists so the breakpoints are pinned in node,
 * and so there is an answer before layout has happened.
 */
export function columnsForWidth(px: number): 1 | 2 | 3 | 4 {
  for (let n = MAX_COLUMNS; n > 1; n -= 1) {
    if (px >= n * MIN_CARD_PX + (n - 1) * GAP_PX) return n as 1 | 2 | 3 | 4;
  }
  return 1;
}

/**
 * The live column count, parsed out of a rendered grid's computed
 * gridTemplateColumns and CLAMPED TO AT LEAST ONE.
 *
 * BrowseGrid.svelte calls columnsFromTemplate(getComputedStyle(list)
 * .gridTemplateColumns) rather than doing the split in markup, because the
 * parse is the part that can go wrong and a spec is the only place it can be
 * proven.
 *
 * On a list that has not been rendered - hidden, detached, or measured before
 * first paint - the property is the string "none", and an empty string means
 * nothing at all. Neither describes a column, so both are dropped and the
 * Math.max below is what supplies the answer: EXPLICITLY one, not one by the
 * accident of "none".split(" ").length. ArrowUp and ArrowDown step by this
 * number, so a 0 would leave the roving focus silently unable to move by row.
 * 05.1-UI-SPEC.md Screen 3 states the clamp as a requirement, not a nicety.
 */
export function columnsFromTemplate(value: string | undefined): number {
  const tracks = (value ?? "")
    .split(" ")
    .filter((track) => track.length > 0 && track !== "none");
  return Math.max(1, tracks.length);
}

/** The keys the grid owns. Anything else is the browser's or the page's. */
const HANDLED = [
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
];

/**
 * The roving-focus arithmetic: where `key` moves focus from `current`.
 *
 * CLAMPS, NEVER WRAPS. Coverflow wraps because it is a ring; a grid is not, and
 * ArrowDown off the last row landing on the first card is disorienting. A step
 * that would leave the list clamps INTO RANGE rather than staying put, which is
 * what keeps a short last row reachable: on a filtered set of thirteen at four
 * columns, ArrowDown from card 9 lands on card 12 instead of refusing to move.
 *
 * Returns UNDEFINED for a key this grid does not handle, so the component knows
 * not to preventDefault it. That is what keeps Space scrolling the page and
 * Alt+Left meaning Back - a handler that swallowed every keydown would take
 * both away.
 *
 * An empty grid returns undefined for every key: there is no card to move to,
 * and returning 0 would put the roving index on a card that does not exist.
 */
export function nextIndex(
  key: string,
  current: number,
  count: number,
  columns: number,
): number | undefined {
  if (!HANDLED.includes(key)) return undefined;
  if (count <= 0) return undefined;

  const last = count - 1;
  const step = Math.max(1, columns);
  const clamp = (n: number) => Math.min(last, Math.max(0, n));

  if (key === "Home") return 0;
  if (key === "End") return last;
  if (key === "ArrowRight") return clamp(current + 1);
  if (key === "ArrowLeft") return clamp(current - 1);
  if (key === "ArrowDown") return clamp(current + step);
  return clamp(current - step);
}
