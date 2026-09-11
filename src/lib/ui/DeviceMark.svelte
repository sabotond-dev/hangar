<!--
  The connection control's dot: the session's shape channel (06-UI-SPEC, The
  9x9 mark, Y-08; re-skinned by plan 13-11 to the PDF's filled dot).

  WHAT CHANGED AND WHAT DID NOT. Phase 6 drew a 24px 9x9 dot field with zero,
  one or five cells lit - the favicon's diagonal for "connected", a walking
  cell for "connecting". PDF pages 2-5 draw the header's control as one
  bordered box reading "ZONA connected" behind ONE small filled dot, lime
  when connected; page 1's "Connect ZONA" carries no dot at all. So the mark
  is now an 8px dot and the four shapes are four fills, on the same tokens
  and no others:

    dark         no dot - the box is reserved, nothing is painted   S0, S1, S5, S6, S7
    detected     the quiet ink                                       S2
    connecting   full ink                                            S3
    connected    the action colour                                   S4

  The four SHAPES are unchanged: DeviceSlot.svelte maps its nine states onto
  the same four names it always did, and a viewer who sees no colour still
  reads "nothing", "something", "brighter" and "the live one". No third hue
  is needed anywhere in the session (06-UI-SPEC, Color), and nothing here
  animates any more, so prefers-reduced-motion has nothing to switch off.
  PadSpinner.svelte is no longer mounted here; its two consumers are
  CatalogCard.svelte and TryOnDevice.svelte.

  THE DOT IS A RADIAL GRADIENT, NOT A BORDER-RADIUS. D-01 forbids every corner
  above zero and D-15 exempts exactly six circles by file and line; a seventh
  `50%` fails the gate. The dot is painted the way the old field painted its
  cells - a radial-gradient on a square box - so no radius is declared.

  THE MARK IS DECORATION. aria-hidden="true" in every state, because the
  caption line and the label line beside it carry the whole meaning; nothing
  the dot says is missing from the text, which is what makes the accent's use
  here honest - it says "this is the live one" and never carries a fact a
  text-only reader would miss.

  8px IN ALL FOUR SHAPES, so the control's width cannot move with the session
  state. No hex literal, no SVG, no icon font, no import at all.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  let {
    shape,
  }: {
    /** The session's four shapes by name; the slot maps its nine states onto them. */
    shape: "dark" | "detected" | "connecting" | "connected";
  } = $props();
</script>

<span
  class="mark"
  data-testid="device-mark"
  data-shape={shape}
  aria-hidden="true"
></span>

<style>
  /* 8px, whatever the shape. flex: none so the box cannot squeeze it. */
  .mark {
    display: inline-block;
    inline-size: 8px;
    block-size: 8px;
    flex: none;
    --dot: transparent;
    background-image: radial-gradient(
      circle at 50% 50%,
      var(--dot) 0 46%,
      transparent 52%
    );
  }

  .mark[data-shape="detected"] {
    --dot: var(--color-ink-quiet);
  }

  .mark[data-shape="connecting"] {
    --dot: var(--color-ink);
  }

  .mark[data-shape="connected"] {
    --dot: var(--color-action);
  }
</style>
