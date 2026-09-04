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

  THE CONSTANT IS IN THE SCRIPT BLOCK, NOT IN THE MARKUP. Prettier reflows text
  inside an element and this sentence is asserted character-for-character - by
  this plan's build check and again by plan 04-09's end-to-end suite. Phase 2
  moved its falsifiable heartbeat definition out of markup for the same reason
  (02-05-SUMMARY.md).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { FrontDoorEntry } from "$lib/catalog/front-door";

  let { entry }: { entry: FrontDoorEntry } = $props();

  /** 04-UI-SPEC, Copywriting Contract. Verbatim, with a real U+2019. */
  const FIDELITY_LINE =
    "Every pad here runs the firmware’s own code, compiled exactly as it would be written to a ZONA. What a screen cannot show: the real colour of the lights, the way they bleed into each other, and how the surface feels under a finger.";

  const quiet = $derived(entry.motion === "animated" ? undefined : entry.quiet);
</script>

<div class="fidelity">
  <p class="line" data-testid="fidelity-line">{FIDELITY_LINE}</p>
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
</style>
