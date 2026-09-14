<!--
  Layer 2 of the pad: the 81 lights, and nothing else. It owns the element and its
  accessible name ("{name}, live pad simulation"), not the pixels: no 2D context,
  no backing-store size, no paint here - the simulator host adopts the element in
  register() and paints on the page's one animation frame (04-UI-SPEC W-07). No
  width or height attribute; CSS sizes the face and image-rendering: pixelated
  hands the upscale to the compositor. Props: entry ({ id, name }, structural),
  hero, onready (hands the element to the parent, which registers it).
  Decided at 04-04 (04-UI-SPEC W-07); see .planning/phases/04-first-experience/04-04-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";

  let {
    entry,
    hero = false,
    onready,
  }: {
    /** Declared structurally (the HostEngine pattern): a ListingEntry and a FrontDoorEntry both fit with no import either way. */
    entry: { id: string; name: string };
    hero?: boolean;
    /** Hands the element to the parent, which is what registers it. */
    onready: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  // A plain binding, never a rune: nothing holding a canvas belongs in reactive state (04-RESEARCH Pitfall 3).
  let el: HTMLCanvasElement | undefined;

  onMount(() => {
    if (el !== undefined) onready(entry.id, el);
  });
</script>

<!--
  A picture of 81 lights, not a control: the approved contract requires role="img"
  with the "live pad simulation" name (04-UI-SPEC, Accessibility), and ARIA places no
  role restriction on canvas. Kept apart from the svelte-ignore line: every word after
  the rule name there is parsed as another rule name.
-->
<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<canvas
  bind:this={el}
  class="led"
  class:hero
  data-testid="pad-canvas-{entry.id}"
  role="img"
  aria-label="{entry.name}, live pad simulation"
></canvas>

<style>
  .led {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    image-rendering: pixelated;
  }

  /* The hero is an instrument: the cursor says so before anything is clicked. */
  .led.hero {
    cursor: crosshair;
  }
</style>
