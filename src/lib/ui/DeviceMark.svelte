<!--
  The device slot's 9x9 mark: the session's shape channel (06-UI-SPEC, The 9x9
  mark; Y-08).

  Four shapes, one component, no canvas and no engine. The header must never
  mount a simulator to say "connected": this is the pad recipe's first layer at
  24px - the same radial-gradient dot field at an 11.111% pitch that
  PadSpinner.svelte declares at 32px - with zero, one or five cells lit in
  --color-action over unlit dots in --color-divider.

    dark         81 dots, nothing lit           S0, S1, S5, S6, S7
    detected     one cell, top-left, static     S2
    connecting   one cell walking the rim       S3 - PadSpinner at 24px, decorative
    connected    five cells down the diagonal   S4 - the favicon's mark, static

  So a viewer who sees no colour at all still reads four different states, and
  no third hue is needed anywhere in the session (06-UI-SPEC, Color).

  THE MARK IS DECORATION. aria-hidden="true" in every state, because the
  caption line and the label line beside it carry the whole meaning; nothing
  the mark says is missing from the text. That is what makes the accent's ninth
  reserved use honest - the lit cells say "this is the live value" and never
  carry a fact a text-only reader would miss - and it is why there is no role
  and no label here to keep in step with the slot's own.

  THE WALK IS NOT RE-AUTHORED. The connecting shape renders
  <PadSpinner size={24} decorative />: one animation, two sizes, and the
  keyframes scale because they are percentage translates on an 11.111% cell.
  Under prefers-reduced-motion the walking shape therefore does not walk - it
  becomes the three static cells PadSpinner already renders there, inherited
  rather than re-implemented, so the two surfaces cannot disagree about what
  "connecting" looks like with motion off.

  24px IN ALL FOUR SHAPES, so the header row's height cannot move with the
  session state. No hex literal, no SVG, no icon font, no import that reaches a
  port: the only specifier is the sibling spinner.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import PadSpinner from "./PadSpinner.svelte";

  let {
    shape,
  }: {
    /** The session's four shapes by name; the slot maps its nine states onto them. */
    shape: "dark" | "detected" | "connecting" | "connected";
  } = $props();

  /**
   * The favicon's diagonal as grid coordinates: cell (0,0) to the centre
   * (4,4). Each lit cell's box is one ninth of the field, so translate(100%,
   * 100%) is one cell down and one cell right, exactly as PadSpinner's
   * keyframes read.
   */
  const DIAGONAL = [0, 1, 2, 3, 4];
</script>

<div
  class="mark"
  data-testid="device-mark"
  data-shape={shape}
  aria-hidden="true"
>
  {#if shape === "connecting"}
    <PadSpinner size={24} decorative />
  {:else}
    <div class="field">
      {#if shape === "detected"}
        <div class="cell"></div>
      {:else if shape === "connected"}
        {#each DIAGONAL as step (step)}
          <div
            class="cell"
            style:transform="translate({step * 100}%, {step * 100}%)"
          ></div>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  /* 24px, whatever the shape. flex: none so a header row cannot squeeze it. */
  .mark {
    position: relative;
    inline-size: 24px;
    block-size: 24px;
    flex: none;
  }

  /* Layer 1 of the pad recipe: PadSpinner's gradient and pitch, at 24px. */
  .field {
    position: relative;
    inline-size: 100%;
    block-size: 100%;
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--color-divider) 0 6%,
      transparent 6.5%
    );
    background-size: 11.111% 11.111%;
  }

  /* One lit cell: PadSpinner's walker, standing still. */
  .cell {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    inline-size: 11.111%;
    block-size: 11.111%;
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--color-action) 0 34%,
      transparent 38%
    );
  }
</style>
