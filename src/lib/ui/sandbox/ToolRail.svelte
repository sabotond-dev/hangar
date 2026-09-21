<!--
  The Sandbox's tool rail (change 15, BENCH-2026-09-16.txt section 15): tool-rail.ts's twelve
  icon-only boxes in their five groups, a hairline between the groups, one stack of 44px squares
  in the shell's tools column beside the inspector; two stacks when the viewport is too short for
  one; a strip that flows above the inspector where the shell stacks. Every box carries its label
  as its accessible name and, with its keys, as its title; the disabled reasons and the helpers
  are sr-only descriptions, the mode line's id in Play. Props: the route's flags, mac, describedBy,
  onaction (an id), ontoggle, onimport (a chosen file's text), onshortcuts (the opener). Square.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    NO_LINK_EXPLANATION,
    TOOLS,
    VIEW_NAMES_HELPER,
    VIEW_NUMBERS_HELPER,
    titledWithKeys,
  } from "$lib/sandbox/copy";
  import { keysWord } from "$lib/sandbox/shortcuts";
  import {
    GLYPH_BOX,
    railBoxes,
    type RailBoxId,
    type RailBoxState,
    type RailFlags,
  } from "$lib/sandbox/tool-rail";
  import {
    EXPORT_PROFILE_HELPER,
    IMPORT_PROFILE_HELPER,
  } from "$lib/share/profile-copy";
  import { EXPORT_ACCEPT } from "$lib/store/transfer";

  let {
    play,
    empty,
    canUndo,
    canRedo,
    exportReason,
    numbers,
    names,
    mac,
    describedBy,
    onaction,
    ontoggle,
    onimport,
    onshortcuts,
  }: RailFlags & {
    mac: boolean;
    /** The id of the line that says why a box is off in Play. */
    describedBy?: string;
    /** An action box pressed: its id, for the route's dispatch. */
    onaction: (id: RailBoxId) => void;
    /** A toggle pressed: its new value, for the route to keep. */
    ontoggle: (which: "numbers" | "names", on: boolean) => void;
    /** A file chosen: its text. */
    onimport: (text: string) => void;
    /** The sheet's box: the element, so Close returns focus to it. */
    onshortcuts: (opener: HTMLElement) => void;
  } = $props();

  const uid = $props.id();
  const helperId = (id: string) => `${uid}-${id}-helper`;

  const groups = $derived(
    railBoxes({
      play,
      empty,
      canUndo,
      canRedo,
      exportReason,
      numbers,
      names,
    }),
  );

  /** The title: a disabled box's reason, else the label with its keys in the platform's words. */
  const titleOf = (box: RailBoxState): string =>
    box.reason ??
    (box.keys === undefined
      ? box.label
      : titledWithKeys(box.label, keysWord(box.keys, mac)));

  /** The sr-only description a box has, by id; undefined for the rest. */
  const helperOf = (box: RailBoxState): string | undefined => {
    switch (box.id) {
      case "export-surface":
        return NO_LINK_EXPLANATION;
      case "export-profile":
        return box.reason ?? EXPORT_PROFILE_HELPER;
      case "import-profile":
        return IMPORT_PROFILE_HELPER;
      case "view-numbers":
        return VIEW_NUMBERS_HELPER;
      case "view-names":
        return VIEW_NAMES_HELPER;
      default:
        return undefined;
    }
  };

  const describes = (box: RailBoxState): string | undefined =>
    box.byMode && box.disabled
      ? describedBy
      : helperOf(box) === undefined
        ? undefined
        : helperId(box.id);

  function press(box: RailBoxState, target: HTMLElement): void {
    if (box.id === "shortcuts-open") onshortcuts(target);
    else if (box.id === "view-numbers") ontoggle("numbers", !numbers);
    else if (box.id === "view-names") ontoggle("names", !names);
    else onaction(box.id);
  }

  /** The chosen file read as text, the input cleared so the same file can be chosen again. */
  async function read(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file === undefined) return;
    const text = await file.text();
    input.value = "";
    onimport(text);
  }
</script>

<div class="rail" role="group" aria-label={TOOLS} data-testid="tool-rail">
  {#each groups as group, g (g)}
    {#if g > 0}<hr class="rule" />{/if}
    {#each group as box (box.id)}
      {#if box.kind === "file"}
        <label class="box file" title={titleOf(box)}>
          <input
            class="sr-only"
            type="file"
            accept={EXPORT_ACCEPT}
            data-testid={box.id}
            aria-label={box.label}
            aria-describedby={describes(box)}
            onchange={(event) => void read(event)}
          />
          {@render glyph(box)}
        </label>
      {:else}
        <button
          class="box"
          type="button"
          data-testid={box.id}
          aria-label={box.label}
          aria-pressed={box.kind === "toggle" ? box.pressed : undefined}
          aria-describedby={describes(box)}
          title={titleOf(box)}
          disabled={box.disabled}
          onclick={(event) => press(box, event.currentTarget)}
        >
          {@render glyph(box)}
        </button>
      {/if}
    {/each}
  {/each}
  {#each groups.flat() as box (box.id)}
    {@const helper = helperOf(box)}
    {#if helper !== undefined}
      <p
        class="sr-only"
        id={helperId(box.id)}
        data-testid={box.id === "export-surface"
          ? "no-link-explanation"
          : undefined}
      >
        {helper}
      </p>
    {/if}
  {/each}
</div>

{#snippet glyph(box: RailBoxState)}
  {#if box.glyph !== undefined}
    <svg class="glyph" viewBox="0 0 {GLYPH_BOX} {GLYPH_BOX}" aria-hidden="true">
      {#each box.glyph as [x1, y1, x2, y2], i (i)}
        <line {x1} {y1} {x2} {y2} />
      {/each}
    </svg>
  {:else}
    <span class="text" aria-hidden="true">{box.text}</span>
  {/if}
{/snippet}

<style>
  /* One stack of 44px squares, the hairlines between the groups full width. */
  .rail {
    display: grid;
    grid-template-columns: 44px;
    gap: 4px;
    box-sizing: border-box;
    justify-content: start;
    align-content: start;
    padding: 16px 8px;
  }

  /* The hairline between two groups: decorative, the divider token. */
  .rule {
    grid-column: 1 / -1;
    margin: 4px 0;
    border: 0;
    border-block-start: 1px solid var(--color-divider);
  }

  /* A box: the boundary token, square, 44px on both axes; pressed it takes the action colour on its border and its glyph. */
  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    inline-size: 44px;
    block-size: 44px;
    padding: 0;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    color: var(--color-ink);
    cursor: pointer;
  }

  .box:hover:not(:disabled) {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  .box:disabled {
    color: var(--color-ink-quiet);
    cursor: default;
  }

  .box[aria-pressed="true"] {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  .glyph {
    inline-size: 20px;
    block-size: 20px;
    overflow: visible;
  }

  .glyph line {
    stroke: currentColor;
    stroke-width: 2;
  }

  /* The ? box: the mono face. */
  .text {
    font-family: var(--font-mono);
    font-size: 16px;
  }

  /* The file box is a label round a visually hidden input: the input keeps the tab stop and the label the look. */
  .file:has(:focus-visible) {
    outline: 2px solid var(--color-action);
    outline-offset: 2px;
  }

  /* Under 768 of viewport height the shell's row is shorter than the twelve boxes in one stack (535 at 720 tall), so the rail takes two stacks. */
  @media (max-height: 767.98px) {
    .rail {
      grid-template-columns: repeat(2, 44px);
    }
  }

  /* The stacked band (below 1024, the shell's own): the rail is a strip above the inspector, the boxes flowing, the hairlines gone. */
  @media (max-width: 1023.98px) {
    .rail {
      grid-template-columns: repeat(auto-fill, 44px);
      inline-size: 100%;
      padding: 12px 16px;
    }

    .rule {
      display: none;
    }
  }
</style>
