<!--
  PREV-03 and D-17: the one quiet line that is always on the screen.

  It states what the simulator matches exactly and what a screen cannot show. It
  is not conditional on anything - chosen or not, animated or not, it is there -
  because a fidelity claim that only appears next to the pads that flatter it
  would not be one.

  Beneath it, when the centred pad is not animated, that entry's own quiet line
  from src/lib/catalog/front-door.ts. That sentence is what makes a still pad
  honest rather than broken: three of the eight configurations really are lit
  pictures that wait for a finger, and the catalog's `motion` flag is derived
  from src/lib/fidelity/golden-frames.json by front-door.spec.ts rather than
  declared, so this line can never disagree with what the pad is doing
  (04-CONTEXT D-20).

  THE ONE EXCEPTION IS `notice`, and it is bounded. An address nobody has heard
  of lands on the shelf, and the deep-link route hands the explanation down here
  to stand in the fidelity line's place for UNKNOWN_NOTICE_MS - long enough to
  read, then it crosses back. The fidelity claim is delayed by four seconds, not
  suppressed.

  THE CONSTANT IS IN THE SCRIPT BLOCK, NOT IN THE MARKUP. Prettier reflows text
  inside an element and this sentence is asserted character-for-character - by
  plan 04-07's build check and again by plan 04-09's end-to-end suite. Phase 2
  moved its falsifiable heartbeat definition out of markup for the same reason
  (02-05-SUMMARY.md).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";

  let {
    entry,
    notice,
  }: {
    entry: FrontDoorEntry;
    /** Stands in for the line below, once, for four seconds. */
    notice?: string;
  } = $props();

  /** 04-UI-SPEC, Copywriting Contract. Verbatim, with a real U+2019. */
  const FIDELITY_LINE =
    "Every pad here runs the firmware’s own code, compiled exactly as it would be written to a ZONA. What a screen cannot show: the real colour of the lights, the way they bleed into each other, and how the surface feels under a finger.";

  /**
   * How long the unknown-address notice holds before the fidelity line comes
   * back. 04-UI-SPEC calls this out as the one piece of timing in the spec with
   * no precedent in the brief, so it lives in one named constant and is easy to
   * change.
   */
  const UNKNOWN_NOTICE_MS = 4000;

  /**
   * Read once. untrack is not decoration: reading a prop at component-init
   * scope otherwise warns that only the initial value is captured - which is
   * exactly right here, because the notice is a one-shot arrival state and
   * must never be re-armed by a later prop change.
   */
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

  /*
    The cross back from the notice, and nothing else in this component ever
    animates: `arrive` is only ever set once the timer has fired.
  */
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
