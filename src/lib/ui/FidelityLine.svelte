<!--
  PREV-03 and D-17: the one quiet line that is always on the screen - what the
  simulator matches exactly and what a screen cannot show - unconditional, so the
  claim never appears only beside the pads that flatter it. Props: entry (its own
  quiet line from front-door.ts renders beneath when the centred pad is not
  animated; the `motion` flag is derived from golden-frames.json, never declared),
  notice (an unknown address's explanation stands in for UNKNOWN_NOTICE_MS, then
  crosses back). The sentence is ./fidelity-line.ts's constant, imported, never
  markup text: prettier reflows element text and it is asserted character for character.
  Decided at 04-07 / 05.1-08 (04-CONTEXT D-17, D-20); see .planning/phases/05.1-catalog-browse/05.1-08-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import { FIDELITY_LINE } from "./fidelity-line";

  let {
    entry,
    notice,
  }: {
    entry: FrontDoorEntry;
    /** Stands in for the line below, once, for four seconds. */
    notice?: string;
  } = $props();

  /** How long the unknown-address notice holds: the one timing with no precedent in the brief (04-UI-SPEC), in one named constant. */
  const UNKNOWN_NOTICE_MS = 4000;

  /** Read once, under untrack: the notice is a one-shot arrival state and must never be re-armed by a later prop change. */
  const arrivedWithNotice = (): boolean => notice !== undefined;

  let noticing = $state(untrack(arrivedWithNotice));
  /** True only after a notice has crossed back, so nothing else ever fades. */
  let crossed = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    if (!noticing) return;
    timer = setTimeout(() => {
      timer = undefined;
      noticing = false;
      crossed = true;
    }, UNKNOWN_NOTICE_MS);
  });

  onDestroy(() => {
    if (timer !== undefined) clearTimeout(timer);
  });

  const quiet = $derived(entry.motion === "animated" ? undefined : entry.quiet);
</script>

<div class="fidelity">
  {#if noticing}
    <p class="line" data-testid="fidelity-notice">{notice}</p>
  {:else}
    <p class="line" class:arrive={crossed} data-testid="fidelity-line">
      {FIDELITY_LINE}
    </p>
  {/if}
  {#if quiet !== undefined}
    <p class="line" data-testid="fidelity-quiet">{quiet}</p>
  {/if}
</div>

<style>
  .fidelity {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  /* Body role. Quiet by colour, never by size (04-UI-SPEC, Typography). */
  .line {
    margin: 0;
    max-inline-size: 62ch;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    text-align: center;
    color: var(--color-ink-quiet);
  }

  /* The cross back from the notice, the only animation here: `arrive` is set once the timer has fired. */
  .arrive {
    animation: cross-back 320ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  @keyframes cross-back {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .arrive {
      animation: none;
    }
  }
</style>
