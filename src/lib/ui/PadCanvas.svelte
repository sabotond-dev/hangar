<!--
  Layer 2 of the pad: the 81 lights, and nothing else.

  This component owns the element and its accessible name. It does not own the
  pixels. There is deliberately no 2D context taken here, no backing-store size
  set here and no paint issued here: the simulator host adopts the element in
  its register() call, sets the 9x9 store itself so exactly one place decides
  it, keeps one reused ImageData per canvas, and does every paint on the page's
  single animation frame (04-UI-SPEC W-07, and the note in src/lib/sim/host.ts).

  Consequently the element carries no width or height attribute. CSS sizes the
  face and image-rendering: pixelated hands the upscale to the compositor, which
  is what makes one draw call per pad per paint enough.

  A screen reader gets "{name}, live pad simulation" - the picture is the
  content, and the slot's description completes the accessible name around it.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";

  let {
    entry,
    hero = false,
    onready,
  }: {
    entry: FrontDoorEntry;
    hero?: boolean;
    /** Hands the element to the parent, which is what registers it. */
    onready: (id: string, canvas: HTMLCanvasElement) => void;
  } = $props();

  // A plain binding, never a rune: nothing that holds a canvas belongs in
  // reactive state (04-RESEARCH, Pitfall 3).
  let el: HTMLCanvasElement | undefined;

  onMount(() => {
    if (el !== undefined) onready(entry.id, el);
  });
</script>

<!--
  Why the next line suppresses the rule rather than obeying it. Svelte counts
  canvas as interactive because it can be scripted into a control. This one is
  not a control - it is a picture of 81 lights, and the approved contract
  (04-UI-SPEC, Accessibility) requires role="img" with the "live pad simulation"
  name so a screen reader announces an image rather than an unlabelled embedded
  object. ARIA itself places no role restriction on canvas. The pointer handling
  that makes the hero playable lives on the slot wrapper in Coverflow.svelte,
  never on this element.

  The explanation is a separate comment on purpose: everything after the rule
  name inside a svelte-ignore comment is parsed as further rule names, and
  svelte/no-unused-svelte-ignore then reports one error per word.
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
