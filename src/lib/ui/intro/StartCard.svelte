<!--
  One of the intro's two start cards, PDF page 1: `ruled` is Card A (a raised
  surface, a 3px action rule down its left edge, a 48 x 48 FILLED square with an
  arrow), `bounded` is Card B (the panel surface in a 1px boundary, an OUTLINED
  square with a plus). Props: variant, eyebrow, title, body, href (a
  ResolvedPathname, the caller's - the card never navigates on its own). The card
  is one link whose name is its words in reading order; the square is decorative.
  Its vertical numbers are custom properties the intro's .cards sets, the PDF's
  108 / 24 / 13 as fallbacks; the square stays 48 at every height. Zero radius (D-01).
  Decided at 13-07 / 13.1-01 (13-CONTEXT D-01); see .planning/phases/13.1-bench-corrections-four/13.1-01-SUMMARY.md

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
    /** Resolved by the caller and typed so: svelte/no-navigation-without-resolve accepts a ResolvedPathname and nothing looser (D-20). */
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
