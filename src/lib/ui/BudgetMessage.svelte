<!--
  Message slot B: the two things the compiler can say about the configuration -
  the fit ladder trimmed something (ladder), or the state is over 908 (over, which
  outranks the ladder). Both shapes declared structurally, never imported. Every
  sentence is $lib/tune/model's, built from $lib/tune/copy; the control's label is
  TURN_IT_DOWN (never PUT BACK - Phase 7's word, kept far apart). Handed nothing it
  renders nothing: a Lua entry never gets a ladder (D-10), and an empty back-off is
  the true story with nothing to offer. Opacity only, never height (160ms fade).
  X-01 use 3 of 3: the 2px error-ink rule on the over block, on the error surface;
  the sentence stays ink and no button is red. Inside the inspector since 13-09.
  Decided at 05-08 / 13-10 (13-CONTEXT D-10); see .planning/phases/13-gui-overhaul/13-10-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { prefersReducedMotion } from "svelte/motion";
  import { fade } from "svelte/transition";
  import { TURN_IT_DOWN } from "$lib/tune/copy";

  /**
   * The two shapes slot B renders, declared structurally (the HostEngine pattern):
   * $lib/tune/model is reached only through `await import()` (D-18), and a LadderView
   * or an OverBudgetView is assignable to the prop at the region's call site.
   */
  type LadderMessage = {
    /** copy.ladderLine over the compiler's own label. Verbatim. */
    line: string;
  };

  type OverBudgetMessage = {
    /** The knob case or the arrived case, already decided by model.ts. */
    line: string;
    /** What the click will do and what the meter will read after it. Empty when there is nothing to offer. */
    backOff: string;
    /** One click, no confirmation: this phase writes nothing to any module. */
    apply: () => void;
  };

  let {
    ladder,
    over,
  }: {
    /** The fit ladder trimmed something and the state fits. */
    ladder?: LadderMessage;
    /** The state does not fit. Outranks the ladder. */
    over?: OverBudgetMessage;
  } = $props();

  /** 160ms linear, instant when the operating system asks for less motion. */
  const FADE_MS = 160;
  const fadeMs = $derived(prefersReducedMotion.current ? 0 : FADE_MS);
</script>

<div class="slot" data-testid="budget-message">
  {#if over}
    <div class="block over" transition:fade={{ duration: fadeMs }}>
      <p class="line">{over.line}</p>
      {#if over.backOff}
        <button
          class="back-off pill"
          type="button"
          data-testid="turn-it-down"
          onclick={over.apply}
        >
          {TURN_IT_DOWN}
        </button>
        <p class="explain">{over.backOff}</p>
      {/if}
    </div>
  {:else if ladder}
    <div class="block ladder" transition:fade={{ duration: fadeMs }}>
      <p class="quiet-line">{ladder.line}</p>
    </div>
  {/if}
</div>

<style>
  /* Auto height; no space at all when there is nothing to say. */
  .slot:not(:empty) {
    margin-block-start: 16px;
  }

  /* 2px left rule, 12px of inline padding. The rule's colour says which. */
  .block {
    border-inline-start: 2px solid var(--color-boundary);
    padding-inline-start: 12px;
  }

  /* X-01 use 3 of 3, the only red here: the rule in the error ink, the block on the error surface, the sentence in ink. Square (D-01). */
  .block.over {
    padding-block: 12px;
    padding-inline: 14px 12px;
    border-inline-start-color: var(--color-error-ink);
    background: var(--color-error-surface);
  }

  /* Body role at full strength: the line naming the knob is the point. */
  .line {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  /* Body role, quiet: the compiler explaining itself, not the panel shouting. */
  .quiet-line,
  .explain {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  /* Phase 4's secondary treatment at 44px, NOT red; the shape is src/app.css's .pill (A-41), which brings the inline floor. Sentence case since 13-19 (D-05). */
  .back-off {
    appearance: none;
    inline-size: fit-content;
    min-block-size: 44px;
    margin-block-start: 8px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: var(--color-ink);
    cursor: pointer;
    transition:
      border-color 140ms ease-out,
      color 140ms ease-out;
  }

  .back-off:hover {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  .explain {
    margin-block-start: 8px;
  }

  @media (prefers-reduced-motion: reduce) {
    .back-off {
      transition: none;
    }
  }
</style>
