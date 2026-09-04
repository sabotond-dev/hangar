<!--
  The name plate: the centred configuration's name AND the row's navigation, in
  one lime-outlined box (04-CONTEXT D-03, "name and navigation are one element").

  Three controls, each with a 44x44 hit area: a back arrow, the name, a forward
  arrow. The triangles are inline SVG at 10x12 and are aria-hidden, so each
  arrow's accessible name comes from its aria-label alone and a screen reader
  never announces a bare "button". The name button's accessible name is
  "Choose {name}" while its visible text stays the bare name (04-UI-SPEC,
  Accessibility Contract).

  The plate is placed AFTER the band in the DOM on purpose: the approved tab
  order is listbox -> back -> name -> forward, and source order gives that for
  free rather than through tabindex juggling.

  THE CROSSFADE, AND WHY ITS DURATION IS READ IN JAVASCRIPT. The name text is
  keyed on entry.id and crossfades 130 ms out / 130 ms in, so the plate never
  jump-cuts in the middle of a 420 ms slide. A Svelte transition's duration is a
  number, not a CSS declaration, so no @media rule can reach it; the reduced
  motion source is therefore svelte/motion's prefersReducedMotion, which is a
  live MediaQuery rather than a one-shot read - an operating-system toggle
  mid-session takes effect with no remount (IDENT-02), which is the same
  guarantee src/lib/sim/host.ts makes for the pads. Under reduce both halves are
  0 ms, which is the contract's instant swap.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { prefersReducedMotion } from "svelte/motion";
  import { fade } from "svelte/transition";
  import type { FrontDoorEntry } from "$lib/catalog/front-door";

  let {
    entry,
    unavailable = false,
    onprev,
    onnext,
    onchoose,
  }: {
    /** The centred entry. Its name is the plate's only text. */
    entry: FrontDoorEntry;
    /**
     * True when the row could not build a simulator engine for this entry.
     * Coverflow reports the set through its onskipped callback; the plate then
     * says so in the copy contract's words instead of pretending it is playable.
     */
    unavailable?: boolean;
    onprev: () => void;
    onnext: () => void;
    /**
     * Choosing. Declared and called here so that plan 04-08, which gives it a
     * body, changes that plan's file rather than this markup a second time.
     * Nothing passes it yet, so the name button is inert for one plan.
     */
    onchoose?: () => void;
  } = $props();

  /** 130 ms out, 130 ms in. Reduced motion swaps instantly (04-UI-SPEC, Motion). */
  const HALF_MS = 130;
  const fadeMs = $derived(prefersReducedMotion.current ? 0 : HALF_MS);

  /** The copy contract's broken-entry name, with a real em dash. */
  const label = $derived(
    unavailable ? `${entry.name} \u2014 unavailable` : entry.name,
  );
</script>

<div class="plate" data-testid="nameplate" data-name={entry.name}>
  <button
    class="arrow"
    type="button"
    data-testid="nameplate-prev"
    aria-label="Previous configuration"
    onclick={onprev}
  >
    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
      <polygon points="10,0 10,12 0,6" fill="currentColor" />
    </svg>
  </button>

  <button
    class="name"
    type="button"
    data-testid="nameplate-name"
    disabled={unavailable}
    aria-label={unavailable ? undefined : `Choose ${entry.name}`}
    onclick={() => onchoose?.()}
  >
    {#key entry.id}
      <span
        class="label"
        in:fade={{ duration: fadeMs, delay: fadeMs }}
        out:fade={{ duration: fadeMs }}>{label}</span
      >
    {/key}
  </button>

  <button
    class="arrow"
    type="button"
    data-testid="nameplate-next"
    aria-label="Next configuration"
    onclick={onnext}
  >
    <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
      <polygon points="0,0 0,12 10,6" fill="currentColor" />
    </svg>
  </button>
</div>

<style>
  .plate {
    display: flex;
    align-items: center;
    inline-size: fit-content;
    margin-inline: auto;
    block-size: 44px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    transition: border-color 160ms ease-out;
  }

  /*
    Hovering any of the three lights the whole box, which is what makes the
    plate read as one control rather than three. :has keeps the gaps between
    the buttons out of it.
  */
  .plate:has(button:hover) {
    border-color: var(--color-accent);
  }

  .arrow,
  .name {
    appearance: none;
    background: transparent;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }

  /* The painted triangle is 10x12; the 44x44 is the hit area (Spacing, note 1). */
  .arrow {
    display: grid;
    place-items: center;
    min-inline-size: 44px;
    min-block-size: 44px;
    color: var(--color-accent);
  }

  /* Heading role: 20px / 600 / 0.01em, mixed case. The only heading on the row. */
  .name {
    display: grid;
    place-items: center;
    min-inline-size: 220px;
    block-size: 44px;
    padding: 0 16px;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    text-align: center;
    text-wrap: balance;
    color: var(--color-ink);
  }

  .name:disabled {
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }

  /*
    Both halves of the crossfade occupy the same grid cell, so the outgoing name
    cannot widen the button while the incoming one is arriving.
  */
  .label {
    grid-area: 1 / 1;
  }
</style>
