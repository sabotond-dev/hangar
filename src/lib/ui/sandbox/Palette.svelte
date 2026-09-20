<!--
  ADD AN ELEMENT: PDF page 3's first rail section, five rows at the rail's numbers
  (the type's name left, its hotkey right - change 10A), and each row IS the
  control: one click arms the kind, and every click on the plate places its
  default region until V, Escape or a second click on the row disarms it; the
  armed row carries D-03's three signals keyed to aria-pressed. Props: mode, placement, atCap, onchoose. Disabled
  with a reason, never without one: at the cap every row is disabled and described
  by GEOMETRY_COPY.cap's sentence under the section; in Play by PLAY_LOCKS_PALETTE. While a
  kind is armed the helper names the fill-to-fit click (13B). Names are KIND_LABELS. Square (D-01).
  Decided at 13-16 (Bible section 8, 15); see .planning/phases/13-gui-overhaul/13-16-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    ADD_AN_ELEMENT,
    KIND_LABELS,
    PALETTE_FILL_HELPER,
    PLAY_LOCKS_PALETTE,
    paletteAddName,
    titledWithKeys,
  } from "$lib/sandbox/copy";
  import { GEOMETRY_COPY } from "$lib/sandbox/geometry";
  import { ELEMENT_KINDS, type ElementKind } from "$lib/sandbox/model";
  import { HOTKEYS, type Mode, type Placement } from "$lib/sandbox/editor";
  import { RAIL_ROW_H } from "$lib/ui/shell/layout";

  let {
    mode,
    placement,
    atCap,
    onchoose,
  }: {
    mode: Mode;
    placement: Placement;
    /** At the cap: every row disabled with the cap's sentence. */
    atCap: boolean;
    /** A row clicked: arm the kind, or disarm it when it is the armed one. */
    onchoose: (kind: ElementKind | undefined) => void;
  } = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  const reasonId = `${uid}-reason`;
  const fillId = `${uid}-fill`;

  /** The one reason every row is disabled for, or undefined when none is. */
  const reason = $derived(
    mode === "play"
      ? PLAY_LOCKS_PALETTE
      : atCap
        ? GEOMETRY_COPY.cap
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
          aria-keyshortcuts={HOTKEYS[kind]}
          title={titledWithKeys(KIND_LABELS[kind], HOTKEYS[kind].toUpperCase())}
          disabled={reason !== undefined}
          aria-describedby={reason !== undefined
            ? reasonId
            : armed === kind
              ? fillId
              : undefined}
          onclick={() => choose(kind)}
        >
          <span class="label">{KIND_LABELS[kind]}</span>
          <kbd class="key" aria-hidden="true">{HOTKEYS[kind].toUpperCase()}</kbd
          >
        </button>
      </li>
    {/each}
  </ul>
  {#if reason !== undefined}
    <p class="reason type-helper" id={reasonId} data-testid="palette-reason">
      {reason}
    </p>
  {:else if armed !== undefined}
    <!-- The fill-to-fit click (change 13B): named while a kind is armed, described by the armed row. -->
    <p class="reason type-helper" id={fillId} data-testid="palette-fill-helper">
      {PALETTE_FILL_HELPER}
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

  /* The row's hotkey: a square mono chip in the quiet ink, the action colour while armed. */
  .key {
    flex: 0 0 auto;
    box-sizing: border-box;
    min-inline-size: 24px;
    padding: 2px 6px;
    border: 1px solid var(--color-boundary);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.4;
    text-align: center;
    color: var(--color-ink-quiet);
  }

  .row[aria-pressed="true"] .key {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  .reason {
    margin: 8px 0 0;
    padding-inline: 12px;
    color: var(--color-ink-quiet);
  }
</style>
