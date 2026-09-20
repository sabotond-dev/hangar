<!--
  The plate's view toggles and the way to the shortcut sheet (change 13C, suggestions 2 and 12):
  a View group of two pressed boxes - the controller numbers, the names - each with its helper as
  its title, and the ? box that opens the sheet. Props: numbers, names, ontoggle (the route
  writes the store), onshortcuts. No state of its own; a pressed box reads by its border and its
  ink, never by a fill alone. Square (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    SHORTCUTS_OPEN_GLYPH,
    SHORTCUTS_TITLE,
    VIEW_GROUP,
    VIEW_NAMES,
    VIEW_NAMES_HELPER,
    VIEW_NUMBERS,
    VIEW_NUMBERS_HELPER,
    titledWithKeys,
  } from "$lib/sandbox/copy";

  let {
    numbers,
    names,
    ontoggle,
    onshortcuts,
  }: {
    numbers: boolean;
    names: boolean;
    /** A box pressed: the toggle's new value, for the route to keep. */
    ontoggle: (which: "numbers" | "names", on: boolean) => void;
    onshortcuts: () => void;
  } = $props();
</script>

<div
  class="view"
  role="group"
  aria-label={VIEW_GROUP}
  data-testid="view-toggles"
>
  <span class="word type-helper">{VIEW_GROUP}</span>
  <button
    class="toggle"
    type="button"
    data-testid="view-numbers"
    aria-pressed={numbers}
    title={VIEW_NUMBERS_HELPER}
    onclick={() => ontoggle("numbers", !numbers)}>{VIEW_NUMBERS}</button
  >
  <button
    class="toggle"
    type="button"
    data-testid="view-names"
    aria-pressed={names}
    title={VIEW_NAMES_HELPER}
    onclick={() => ontoggle("names", !names)}>{VIEW_NAMES}</button
  >
  <button
    class="toggle help"
    type="button"
    data-testid="shortcuts-open"
    aria-label={SHORTCUTS_TITLE}
    title={titledWithKeys(SHORTCUTS_TITLE, SHORTCUTS_OPEN_GLYPH)}
    onclick={onshortcuts}>{SHORTCUTS_OPEN_GLYPH}</button
  >
</div>

<style>
  .view {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .word {
    margin-inline-end: 4px;
    color: var(--color-ink-quiet);
  }

  /* A box: outlined, 44px, square; pressed it takes the action colour on its border and its word. */
  .toggle {
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 12px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    white-space: nowrap;
    color: var(--color-ink-quiet);
    cursor: pointer;
  }

  .toggle:hover {
    border-color: var(--color-action);
  }

  .toggle[aria-pressed="true"] {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  /* The ? box: the mono face, the ink. */
  .help {
    padding-inline: 0;
    font-family: var(--font-mono);
    font-size: 16px;
    color: var(--color-ink);
  }
</style>
