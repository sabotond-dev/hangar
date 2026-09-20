<!--
  The shortcut sheet (change 13C, suggestion 2): one dialog over the page listing every key the
  Sandbox answers, from shortcuts.ts's groups - the keys as they read on this platform (Cmd and
  Option on a Mac) and what each does. Opens on ? and the toolbar's ? box; Escape, the Close box
  or a press on the scrim closes it; focus lands on Close and Tab stays inside. Props: mac,
  onclose. No state of its own. Square (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    SHORTCUTS_CLOSE,
    SHORTCUTS_DOES_COLUMN,
    SHORTCUTS_KEYS_COLUMN,
    SHORTCUTS_LEDE,
    SHORTCUTS_TITLE,
  } from "$lib/sandbox/copy";
  import { SHORTCUT_GROUPS, keysWord } from "$lib/sandbox/shortcuts";

  let {
    mac = false,
    onclose,
  }: {
    /** Cmd and Option for Ctrl and Alt. */
    mac?: boolean;
    onclose: () => void;
  } = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;

  let sheet = $state<HTMLDivElement | null>(null);

  /** Close takes focus the moment the sheet mounts. */
  function mounted(node: HTMLButtonElement): void {
    node.focus();
  }

  /** Escape closes; Tab stays inside (the sheet's focusable set is its Close box). */
  function onkeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      onclose();
      return;
    }
    if (event.key === "Tab" && sheet !== null) {
      const focusable = sheet.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      if (focusable.length <= 1) event.preventDefault();
    }
  }

  /** A press on the scrim, outside the sheet, closes. */
  function onscrim(event: PointerEvent): void {
    if (event.target === event.currentTarget) onclose();
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="scrim" data-testid="shortcut-sheet" onpointerdown={onscrim}>
  <div
    bind:this={sheet}
    class="sheet"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-labelledby={titleId}
    {onkeydown}
  >
    <div class="head">
      <h2 class="title type-group-title" id={titleId}>{SHORTCUTS_TITLE}</h2>
      <button
        class="outlined"
        type="button"
        data-testid="shortcut-sheet-close"
        use:mounted
        onclick={onclose}>{SHORTCUTS_CLOSE}</button
      >
    </div>
    <p class="lede type-helper">{SHORTCUTS_LEDE}</p>
    <table class="keys-table" data-testid="shortcut-table">
      <thead>
        <tr>
          <th scope="col">{SHORTCUTS_KEYS_COLUMN}</th>
          <th scope="col">{SHORTCUTS_DOES_COLUMN}</th>
        </tr>
      </thead>
      {#each SHORTCUT_GROUPS as group (group.title)}
        <tbody data-testid="shortcut-group">
          <tr>
            <th class="group" scope="rowgroup" colspan="2">{group.title}</th>
          </tr>
          {#each group.rows as row (row.keys.join("|") + row.what)}
            <tr data-testid="shortcut-row">
              <td class="keys">
                {#each row.keys as key, i (key)}
                  {#if i > 0}<span class="or" aria-hidden="true"> / </span>{/if}
                  <kbd>{keysWord(key, mac)}</kbd>
                {/each}
              </td>
              <td>{row.what}</td>
            </tr>
          {/each}
        </tbody>
      {/each}
    </table>
  </div>
</div>

<style>
  /* The scrim: the whole viewport, the ground at six tenths, the sheet centred on it. */
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgb(0 0 0 / 0.6);
  }

  /* The sheet: the panel token under a boundary hairline, at most 560 wide, its rows scrolling on the block axis only. */
  .sheet {
    box-sizing: border-box;
    inline-size: min(100%, 560px);
    max-block-size: 100%;
    overflow-y: auto;
    padding: 20px 24px 24px;
    border: 1px solid var(--color-boundary);
    background: var(--color-panel);
    color: var(--color-ink);
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .title {
    margin: 0;
  }

  .lede {
    margin: 8px 0 16px;
    color: var(--color-ink-quiet);
  }

  .outlined {
    flex: none;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .outlined:hover {
    border-color: var(--color-action);
  }

  .keys-table {
    inline-size: 100%;
    border-collapse: collapse;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
  }

  .keys-table th,
  .keys-table td {
    padding: 6px 12px 6px 0;
    text-align: start;
    vertical-align: top;
    border-block-end: 1px solid var(--color-divider);
  }

  .keys-table thead th {
    font-weight: 600;
    color: var(--color-ink-quiet);
  }

  /* A group's title row: the micro role's tracking, above its rows. */
  .group {
    padding-block-start: 16px;
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
  }

  .keys {
    inline-size: 42%;
    white-space: nowrap;
  }

  /* A key: the palette's chip - a square mono box in the quiet ink. */
  kbd {
    display: inline-block;
    box-sizing: border-box;
    min-inline-size: 24px;
    padding: 2px 6px;
    border: 1px solid var(--color-boundary);
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.4;
    text-align: center;
    color: var(--color-ink);
  }

  .or {
    color: var(--color-ink-quiet);
  }
</style>
