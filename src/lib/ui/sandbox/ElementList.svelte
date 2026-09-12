<!--
  ON THIS SURFACE: PDF page 3's second rail section (plan 13-16; Bible
  section 14's "an element list so the surface is not the sole means of
  selection"; BUILD-08).

  One row per placed element, its name left and its TYPE right in secondary
  (`Filter / Fader`), the selected row raised and ruled with D-03's three
  signals keyed to aria-current - the same paint as Rail.svelte's rows, at
  the same numbers. THIS LIST IS NOT DECORATION: it is a complete alternative
  to the plate for selection. Every row is a real button (a tab stop that
  Enter and Space activate), ArrowUp and ArrowDown move focus between rows
  so the list can be walked without leaving it, Home and End jump, and
  Delete on a focused row is the same delete the inspector offers. A
  screen reader hears `Filter, Fader` for the row and `current` for the
  selected one.

  Selection is two-way: a row's click reports its id and the route selects
  it in the editor; the plate's selection arrives back as `selectedId`
  and the row re-raises. Nothing here holds state of its own.

  The empty section says so in one quiet line (section 15's "empty" state)
  rather than vanishing; the centre's empty state carries the instruction.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    KIND_LABELS,
    LIST_EMPTY,
    ON_THIS_SURFACE,
    listRowName,
  } from "$lib/sandbox/copy";
  import type { Region } from "$lib/sandbox/model";
  import { RAIL_ROW_H } from "$lib/ui/shell/layout";

  let {
    regions,
    selectedId,
    onselect,
    ondelete,
  }: {
    regions: readonly Region[];
    selectedId: string | undefined;
    onselect: (id: string) => void;
    /** Delete on a focused row: the same deletion the inspector's button makes. */
    ondelete?: (id: string) => void;
  } = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;

  let list = $state<HTMLUListElement | null>(null);

  /** Arrows walk the rows; Home and End jump; Delete deletes the focused row's element. */
  function onkeydown(event: KeyboardEvent, id: string, index: number): void {
    const rows = list
      ? Array.from(list.querySelectorAll<HTMLButtonElement>("button[data-row]"))
      : [];
    let target: number | undefined;
    if (event.key === "ArrowDown")
      target = Math.min(rows.length - 1, index + 1);
    else if (event.key === "ArrowUp") target = Math.max(0, index - 1);
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = rows.length - 1;
    else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      ondelete?.(id);
      return;
    }
    if (target === undefined) return;
    event.preventDefault();
    rows[target]?.focus();
  }
</script>

<section
  class="group"
  data-testid="element-list"
  aria-labelledby={titleId}
  style:--rail-row-h="{RAIL_ROW_H}px"
>
  <h2 class="title type-micro" id={titleId}>{ON_THIS_SURFACE}</h2>
  {#if regions.length === 0}
    <p class="empty type-helper" data-testid="element-list-empty">
      {LIST_EMPTY}
    </p>
  {:else}
    <ul class="rows" bind:this={list}>
      {#each regions as region, index (region.id)}
        <li>
          <button
            class="row"
            type="button"
            data-row={region.id}
            data-testid="element-row"
            aria-current={region.id === selectedId ? "true" : undefined}
            aria-label={listRowName(region.name, KIND_LABELS[region.kind])}
            onclick={() => onselect(region.id)}
            onkeydown={(event) => onkeydown(event, region.id, index)}
          >
            <span class="label">{region.name}</span>
            <span class="side">{KIND_LABELS[region.kind]}</span>
          </button>
        </li>
      {/each}
    </ul>
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

  /* Rail.svelte's row, at its numbers: the 3px slot reserved on every row. */
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

  .row:hover {
    background: var(--color-raised);
  }

  /* D-03's three signals, together, on the selected row. */
  .row[aria-current] {
    background: var(--color-raised);
    border-inline-start: 3px solid var(--color-action);
  }

  .row[aria-current] .label {
    color: var(--color-action);
  }

  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .side {
    flex: 0 0 auto;
    font-size: 13px;
    color: var(--color-ink-quiet);
  }

  .empty {
    margin: 0;
    padding-inline: 12px;
    color: var(--color-ink-quiet);
  }
</style>
