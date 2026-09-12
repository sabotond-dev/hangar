<!--
  One of the intro's two start cards (plan 13-07; PDF page 1, left column;
  13-RESEARCH.md section 1 "Page 1 - the intro").

  TWO VARIANTS, ONE SHAPE. `ruled` is the PDF's Card A: a raised surface with
  a 3px action-colour rule down its left edge and a 48 x 48 FILLED action
  square carrying an arrow at its right. `bounded` is Card B: the panel
  surface inside a 1px boundary, and a 48 x 48 OUTLINED square carrying a
  plus. Both squares are squares - D-01 makes them so, and the whole card is
  authored at zero radius; this file takes no allowlist row.

  THE CARD IS ONE LINK. The eyebrow, the title and the body are the link's
  text in reading order, so its accessible name is the words a visitor reads,
  and the square is decorative (aria-hidden): the glyph repeats what the title
  already says. The href is the caller's - the intro chooses the destination
  and the card never navigates on its own.

  Measured on the PDF at a 1500px render width (MEDIUM confidence, raster):
  height 108, eyebrow 11px tracked uppercase, title about 24px in the display
  face, body about 13px in the secondary colour, square 48. Every colour is
  one of 13-03's eleven tokens.

  ITS VERTICAL NUMBERS ARE THE INTRO'S TO SCALE (plan 13.1-01; D-01): the
  minimum height, the block padding, the text gap and the title size are
  read from custom properties the intro's .cards sets, with the PDF's values
  as the fallbacks, so the card is the PDF's on its own and shrinks with the
  intro when the screen is short. The square stays 48 at every height - it
  is the affordance - and the eyebrow and the body keep their roles.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { ResolvedPathname } from "$app/types";

  let {
    variant,
    eyebrow,
    title,
    body,
    href,
    testid,
  }: {
    variant: "ruled" | "bounded";
    /** Short, uppercase, the PDF's own or a ledgered label. */
    eyebrow: string;
    title: string;
    body: string;
    /**
     * Resolved by the caller - resolve() or a SECTIONS entry - and typed
     * so: svelte/no-navigation-without-resolve accepts a ResolvedPathname
     * and nothing looser, which is what keeps every address on this page
     * one 13-08 can move (D-20).
     */
    href: ResolvedPathname;
    testid: string;
  } = $props();

  const glyph = $derived(variant === "ruled" ? "↗" : "+");
</script>

<a class="card {variant}" {href} data-testid={testid} data-variant={variant}>
  <span class="text">
    <span class="eyebrow type-micro">{eyebrow}</span>
    <span class="title">{title}</span>
    <span class="body type-helper">{body}</span>
  </span>
  <span class="square" aria-hidden="true">{glyph}</span>
</a>

<style>
  .card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    box-sizing: border-box;
    min-block-size: var(--start-card-min, 108px);
    padding: var(--start-card-pad, 16px) 24px;
    text-decoration: none;
    color: var(--color-ink);
  }

  .card:hover {
    color: var(--color-ink);
  }

  /* Card A: the raised surface with the action rule down its left edge. */
  .card.ruled {
    background: var(--color-raised);
    border-inline-start: 3px solid var(--color-action);
  }

  /* Card B: the panel surface inside a 1px boundary, no rule. */
  .card.bounded {
    background: var(--color-panel);
    border: 1px solid var(--color-boundary);
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: var(--start-card-gap, 6px);
    min-inline-size: 0;
  }

  .eyebrow {
    color: var(--color-ink-quiet);
  }

  .title {
    font-family: var(--font-display);
    font-size: var(--start-card-title, 24px);
    font-weight: 700;
    line-height: 1.15;
  }

  .body {
    color: var(--color-ink-quiet);
  }

  /* The square is a square: 48 on both axes, never rounded (D-01). */
  .square {
    flex: none;
    display: grid;
    place-items: center;
    inline-size: 48px;
    block-size: 48px;
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    line-height: 1;
  }

  .ruled .square {
    background: var(--color-action);
    color: var(--color-on-action);
  }

  .bounded .square {
    border: 1px solid var(--color-boundary);
    color: var(--color-ink);
  }
</style>
