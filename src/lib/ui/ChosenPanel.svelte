<!--
  The panel that appears when a visitor chooses the centre pad. D-05: that is
  the whole point of the front door, and nothing about the device exists on the
  page until it happens.

  This component owns LAYOUT and nothing else. The primary control, the honesty
  line and the connect-state region are one snippet handed in by the caller, so
  the state machine that touches a port lives in TryOnDevice.svelte and the box
  it sits in lives here. Top to bottom the panel is D-08's order, and Phase 5
  docks into it without moving anything:

    1. the primary control            these three are the caller's snippet
    2. the honesty line
    3. the connect-state region
    4. the reserved tuning region     Phase 5 replaces its contents
    5. a 24px gap, a hairline, 24px
    6. KEEP ON DEVICE, disabled

  THE RESERVED REGION'S HEIGHT IS LOAD-BEARING, NOT DECORATIVE. 152px is 96px
  for Phase 5's knob rack plus 56px for its two character meters. Reserving it
  now is what lets Phase 5 dock those in without the panel growing under a
  visitor who is already reading it - the primary control would jump upward on
  the first release that adds a knob, on the one screen where a visitor is being
  asked to trust the site with their hardware.

  It draws a caption and one sentence, and no meter (W-19). An inert reading
  with a dash where a number belongs reads as broken rather than as reserved,
  and the sentence says the same thing honestly.

  The entrance is here rather than in the caller because the element only exists
  while it is chosen: 16px up and a fade over 260ms, or opacity alone over 120ms
  for a visitor who asked for less motion.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";
  import KeepOnDevice from "./KeepOnDevice.svelte";

  let {
    entry,
    children,
  }: {
    /**
     * The chosen configuration. The panel names it so a screen reader knows
     * which pad these controls act on, and publishes its id so a test can see
     * the panel re-fill on a step without the connect state resetting (W-20).
     */
    entry: FrontDoorEntry;
    /** Regions 1 to 3: the primary control, its honesty line, its status. */
    children?: Snippet;
  } = $props();

  /* The copy contract's words, in consts because Prettier reflows markup text. */
  const TUNING_CAPTION = "TUNING";
  const TUNING_BODY =
    "Knobs and the two 908-character budgets arrive in the next release.";
</script>

<section
  class="panel"
  data-testid="chosen-panel"
  data-entry={entry.id}
  aria-label={entry.name}
>
  {@render children?.()}

  <div class="reserved" data-testid="tuning-reserved">
    <p class="caption">{TUNING_CAPTION}</p>
    <p class="body">{TUNING_BODY}</p>
  </div>

  <hr class="rule" />

  <KeepOnDevice />
</section>

<style>
  .panel {
    max-inline-size: 420px;
    margin-inline: auto;
    padding: 24px;
    border: 1px solid var(--color-line);
    border-radius: 10px;
    animation: arrive 260ms cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  @keyframes arrive {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /*
    96px for the knob rack + 56px for the two meters. See the header: this is
    the number that keeps Phase 5 from resizing the panel.
  */
  .reserved {
    margin-block-start: 24px;
    padding: 16px;
    border: 1px dashed var(--color-line-soft);
    border-radius: 10px;
    min-block-size: 152px;
  }

  /* Micro role, uppercase: a structural caption of one word. */
  .caption {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  /* Body role. */
  .body {
    margin: 16px 0 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* 24px, a hairline, 24px. The gap the two install controls never close. */
  .rule {
    margin-block: 24px;
    border: 0;
    border-block-start: 1px solid var(--color-line-soft);
  }

  @media (prefers-reduced-motion: reduce) {
    .panel {
      animation: fade-in 120ms linear;
    }

    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  }
</style>
