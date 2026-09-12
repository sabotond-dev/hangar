<!--
  ADD AN ELEMENT: PDF page 3's first rail section (plan 13-16; Bible section
  8's "element first" path; section 15's palette states - available,
  incompatible, selected, empty).

  Four rows at the rail's numbers, each the type's name left and a `+`
  right, and each row IS the control: one click arms the kind, and the next
  click on the plate places its default region (editor.ts section 1). The
  armed row is drawn with D-03's three signals keyed to aria-pressed, so the
  visitor can see which kind the next click will place, and a second click
  on the same row disarms it.

  DISABLED WITH A REASON, NEVER WITHOUT ONE. At the cap (sixteen, D-14 Q4;
  the meter is the finer gate) every row is `disabled` and aria-describedby
  points at GEOMETRY_COPY.cap's sentence rendered under the section; in Play
  the same rows are disabled with PLAY_LOCKS_PALETTE, because Play routes a
  click to the surface and an armed kind would have nowhere to land. Both
  reasons are real text in the section, not a title attribute.

  No number here is its own: RAIL_ROW_H and the 44px floor are layout.ts's
  and Rail.svelte's; the four names are the PDF's (KIND_LABELS). Square
  corners (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    ADD_AN_ELEMENT,
    KIND_LABELS,
    PALETTE_ADD,
    PLAY_LOCKS_PALETTE,
    paletteAddName,
  } from "$lib/sandbox/copy";
  import { GEOMETRY_COPY } from "$lib/sandbox/geometry";
  import {
    ELEMENT_KINDS,
    SURFACE_ELEMENT_CAP,
    type ElementKind,
  } from "$lib/sandbox/model";
  import type { Mode, Placement } from "$lib/sandbox/editor";
  import { RAIL_ROW_H } from "$lib/ui/shell/layout";

  let {
    mode,
    placement,
    atCap,
    onchoose,
  }: {
    mode: Mode;
    placement: Placement;
    /** Sixteen on the surface: every `+` disabled with the cap's sentence. */
    atCap: boolean;
    /** A row clicked: arm the kind, or disarm it when it is the armed one. */
    onchoose: (kind: ElementKind | undefined) => void;
  } = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  const reasonId = `${uid}-reason`;

  /** The one reason every row is disabled for, or undefined when none is. */
  const reason = $derived(
    mode === "play"
      ? PLAY_LOCKS_PALETTE
      : atCap
        ? GEOMETRY_COPY.cap(SURFACE_ELEMENT_CAP)
        : undefined,
  );

  const armed = $derived(
    placement.kind === "element" ? placement.type : undefined,
  );

  function choose(kind: ElementKind): void {
    onchoose(armed === kind ? undefined : kind);
  }
</script>

<section
  class="group"
  data-testid="palette"
  aria-labelledby={titleId}
  style:--rail-row-h="{RAIL_ROW_H}px"
>
  <h2 class="title type-micro" id={titleId}>{ADD_AN_ELEMENT}</h2>
  <ul class="rows">
    {#each ELEMENT_KINDS as kind (kind)}
      <li>
        <button
          class="row"
          type="button"
          data-testid="palette-{kind}"
          data-kind={kind}
          aria-label={paletteAddName(KIND_LABELS[kind])}
          aria-pressed={armed === kind}
          disabled={reason !== undefined}
          aria-describedby={reason === undefined ? undefined : reasonId}
          onclick={() => choose(kind)}
        >
          <span class="label">{KIND_LABELS[kind]}</span>
          <span class="side" aria-hidden="true">{PALETTE_ADD}</span>
        </button>
      </li>
    {/each}
  </ul>
  {#if reason !== undefined}
    <p class="reason type-helper" id={reasonId} data-testid="palette-reason">
      {reason}
    </p>
  {/if}
</section>

<style>
  .title {
    margin: 0;
    padding-inline: 12px;
    padding-block: 12px 8px;
    color: var(--color-ink-quiet);
  }

  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Rail.svelte's row: the PDF's 40 beneath the 44px floor, the 3px slot reserved. */
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: max(var(--rail-row-h), 44px);
    min-inline-size: 44px;
    padding-inline: 12px;
    border: 0;
    border-inline-start: 3px solid transparent;
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 15px;
    line-height: 1.3;
    text-align: start;
    color: var(--color-ink);
    cursor: pointer;
  }

  .row:hover:not(:disabled) {
    background: var(--color-raised);
  }

  /* D-03's three signals on the armed kind, keyed to aria-pressed. */
  .row[aria-pressed="true"] {
    background: var(--color-raised);
    border-inline-start: 3px solid var(--color-action);
  }

  .row[aria-pressed="true"] .label {
    color: var(--color-action);
  }

  .row:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  .side {
    flex: 0 0 auto;
    font-size: 17px;
    color: var(--color-ink-quiet);
  }

  .reason {
    margin: 8px 0 0;
    padding-inline: 12px;
    color: var(--color-ink-quiet);
  }
</style>
