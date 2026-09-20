<!--
  The plate's menu (change 13C, suggestion 1): the items menu.ts built, drawn where the pointer
  was (or over the selection for the keyboard), each a real menuitem - disabled ones with their
  reason as the title - and Align / Space out as submenus that open on hover, click or the right
  arrow. Keyboard: the arrows walk the enabled items and wrap, Home and End jump, Enter or Space
  runs the focused one, the left arrow or Escape closes a submenu, Escape or Tab closes the menu;
  a press outside it closes it too. Props: items, x and y (fractions of the plate), mac (the
  modifier's word), onaction, onclose. No state of its own past the open submenu. Square (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { MENU_NAME } from "$lib/sandbox/copy";
  import type { MenuAction, MenuItem } from "$lib/sandbox/menu";
  import { keysWord } from "$lib/sandbox/shortcuts";

  let {
    items,
    x,
    y,
    mac = false,
    onaction,
    onclose,
  }: {
    items: readonly MenuItem[];
    /** Where it opens, as fractions of the plate's width and height. */
    x: number;
    y: number;
    /** Cmd and Option in the key hints. */
    mac?: boolean;
    /** A leaf chosen: the route runs the editor command; the plate closes the menu. */
    onaction: (action: MenuAction) => void;
    onclose: () => void;
  } = $props();

  let root = $state<HTMLDivElement | null>(null);
  /** The open submenu's parent id, or undefined. */
  let open = $state<string | undefined>(undefined);

  /** Past the middle the menu grows toward the other edge, so it stays on the plate. */
  const flipX = $derived(x > 0.55);
  const flipY = $derived(y > 0.55);
  const pct = (f: number) => `${(f * 100).toFixed(2)}%`;

  /** The enabled menuitems of one menu element, in order. */
  function itemsOf(menu: HTMLElement): HTMLButtonElement[] {
    return Array.from(
      menu.querySelectorAll<HTMLButtonElement>(
        ':scope > .row > button[role="menuitem"]:not(:disabled)',
      ),
    );
  }

  function focusFirst(menu: HTMLElement): void {
    itemsOf(menu)[0]?.focus();
  }

  /** The root takes focus on its first item the moment it mounts. */
  function mounted(node: HTMLDivElement): void {
    focusFirst(node);
  }

  function act(item: MenuItem): void {
    if (item.action === undefined || item.disabled !== undefined) return;
    onaction(item.action);
  }

  /** The menu element the focused item belongs to: a submenu, or the root. */
  function menuOf(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof HTMLElement)) return root;
    return target.closest<HTMLElement>('[role="menu"]') ?? root;
  }

  function onkeydown(event: KeyboardEvent): void {
    // Every key is the menu's while it is open: nothing reaches the plate or the window.
    event.stopPropagation();
    const menu = menuOf(event.target);
    if (menu === null) return;
    const list = itemsOf(menu);
    const at = list.findIndex((b) => b === document.activeElement);
    const inSub = menu !== root;
    switch (event.key) {
      case "ArrowDown":
        list[(at + 1 + list.length) % list.length]?.focus();
        break;
      case "ArrowUp":
        list[(at - 1 + list.length) % list.length]?.focus();
        break;
      case "Home":
        list[0]?.focus();
        break;
      case "End":
        list[list.length - 1]?.focus();
        break;
      case "ArrowRight": {
        const parent = list[at];
        const id = parent?.dataset.parent;
        if (id !== undefined) {
          open = id;
          queueMicrotask(() => {
            const sub = root?.querySelector<HTMLElement>(
              `[data-submenu="${id}"]`,
            );
            if (sub) focusFirst(sub);
          });
        }
        break;
      }
      case "ArrowLeft":
        if (inSub) closeSub();
        break;
      case "Escape":
        if (inSub) closeSub();
        else onclose();
        break;
      case "Tab":
        onclose();
        return;
      case "Enter":
      case " ":
        // The button's own click runs it.
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  /** A submenu closes onto its parent item. */
  function closeSub(): void {
    const id = open;
    open = undefined;
    if (id === undefined) return;
    root
      ?.querySelector<HTMLButtonElement>(`button[data-parent="${id}"]`)
      ?.focus();
  }

  /** A submenu parent clicked or entered by the pointer: it opens; a leaf entered closes any submenu. */
  function toggleSub(id: string): void {
    open = open === id ? undefined : id;
  }

  /** A press anywhere outside the menu closes it, before the plate reads the press. */
  function onOutside(event: PointerEvent): void {
    if (root === null) return;
    if (event.target instanceof Node && root.contains(event.target)) return;
    onclose();
  }

  onMount(() => {
    document.addEventListener("pointerdown", onOutside, true);
    return () => document.removeEventListener("pointerdown", onOutside, true);
  });
</script>

<div
  bind:this={root}
  class="menu"
  class:flip-x={flipX}
  role="menu"
  tabindex="-1"
  aria-label={MENU_NAME}
  data-testid="surface-menu"
  style:left={flipX ? undefined : pct(x)}
  style:right={flipX ? pct(1 - x) : undefined}
  style:top={flipY ? undefined : pct(y)}
  style:bottom={flipY ? pct(1 - y) : undefined}
  use:mounted
  {onkeydown}
  onpointerdown={(event) => event.stopPropagation()}
  oncontextmenu={(event) => event.preventDefault()}
>
  {#each items as item (item.id)}
    <div class="row" role="none">
      {#if item.submenu !== undefined}
        <button
          class="item"
          type="button"
          role="menuitem"
          data-testid="menu-{item.id}"
          data-parent={item.id}
          aria-haspopup="menu"
          aria-expanded={open === item.id}
          onpointerenter={() => (open = item.id)}
          onclick={() => toggleSub(item.id)}
        >
          <span class="label">{item.label}</span>
          <span class="arrow" aria-hidden="true">▸</span>
        </button>
        {#if open === item.id}
          <div
            class="menu sub"
            role="menu"
            aria-label={item.label}
            data-submenu={item.id}
            data-testid="menu-{item.id}-submenu"
          >
            {#each item.submenu as sub (sub.id)}
              <div class="row" role="none">
                <button
                  class="item"
                  type="button"
                  role="menuitem"
                  data-testid="menu-{sub.id}"
                  disabled={sub.disabled !== undefined}
                  title={sub.disabled}
                  onclick={() => act(sub)}
                >
                  <span class="label">{sub.label}</span>
                </button>
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <button
          class="item"
          type="button"
          role="menuitem"
          data-testid="menu-{item.id}"
          disabled={item.disabled !== undefined}
          title={item.disabled}
          onpointerenter={() => (open = undefined)}
          onclick={() => act(item)}
        >
          <span class="label">{item.label}</span>
          {#if item.keys !== undefined}
            <kbd class="keys">{keysWord(item.keys, mac)}</kbd>
          {/if}
        </button>
      {/if}
    </div>
  {/each}
</div>

<style>
  /* The menu: over the plate, the panel token under a boundary hairline, 224 wide. No corner (D-01). */
  .menu {
    position: absolute;
    z-index: 2;
    box-sizing: border-box;
    inline-size: 224px;
    padding-block: 4px;
    border: 1px solid var(--color-boundary);
    background: var(--color-panel);
  }

  /* A submenu opens beside its parent row, to the right, or to the left when the menu grew leftward. */
  .row {
    position: relative;
  }

  .sub {
    top: -5px;
    left: 100%;
  }

  .flip-x .sub {
    left: auto;
    right: 100%;
  }

  /* An item: a full-width row at the 44px floor, the label left and the keys right; the focused or hovered one in the action colour. */
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: 44px;
    padding-inline: 12px;
    border: 0;
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    text-align: start;
    color: var(--color-ink);
    cursor: pointer;
  }

  .item:hover:not(:disabled),
  .item:focus-visible,
  .item[aria-expanded="true"] {
    color: var(--color-action);
    outline: none;
  }

  .item:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: -2px;
  }

  .item:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  .keys {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-ink-quiet);
  }

  .arrow {
    font-size: 12px;
  }
</style>
