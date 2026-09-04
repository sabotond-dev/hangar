<!--
  Message slot B: the two things the compiler can say about the configuration.

  Either the fit ladder trimmed something to stay inside 908, or the state is
  over 908. Never both, and over budget wins - a line explaining what was turned
  down to make it fit is not true of a state that did not fit.

  EVERY SENTENCE HERE COMES FROM $lib/tune/model, WHICH BUILT IT FROM
  $lib/tune/copy. Not one is authored below. The ladder's own words are the
  COMPILER's - BOTOR writes them as whole sentences ("Stop drawing the control
  on the pad") and copy.ladderLine lower-cases the first character only, where
  the label sits inside another sentence. Rewriting them here would be a second
  copy of the same explanation, and two copies drift.

  WHY THE LABEL ON THE CONTROL IS "TURN IT DOWN" AND DELIBERATELY NOT
  "PUT IT BACK". Phase 7 owns PUT BACK, for restoring a module's own
  configuration off a snapshot taken at connect. Two near-identical labels a
  phase apart on the same panel, one of which rewrites what is on somebody's
  hardware, would be a genuine hazard - so the two names are kept far apart
  while there is still only one of them. The string itself is TURN_IT_DOWN in
  $lib/tune/copy and is not spelled in this file.

  WHEN NOTHING IS RENDERED. The back-off control appears only when there is
  something to turn down. model.ts resolves it in one order - put the visitor's
  own knob back if a knob moved and there is a number to put it back to, else
  apply the compiler's first ladder step - and when fit() is blocked and no knob
  moved it hands over an EMPTY back-off string, because there is genuinely
  nothing to offer. An empty control that did nothing would be worse than no
  control: the over-budget line still says the configuration is over 908, which
  is the true and complete story in that corner.

  NEVER SHOWN FOR A LUA ENTRY. D-10: their whole knob cross-product was proven
  in budget at build time in Phase 8, so there is no runtime ladder for them and
  inventing a line would fake a mechanism that does not exist. This component
  needs no branch for it - handed nothing, it renders nothing, and model.ts
  never hands it a ladder for a Lua entry.

  THE APPEARANCE IS OPACITY, NEVER HEIGHT. Slot B is auto height and moves only
  inert content beneath it; a height transition would animate the whole region
  under the visitor's pointer while they are still turning the knob that caused
  it. svelte/transition's fade animates opacity and nothing else by
  construction, at 160ms linear, and collapses to 0ms under reduced motion.

  X-01 use 3 of 3 lives here: the 2px --color-over left rule on the over-budget
  block. The SENTENCE stays --color-ink - red is a marker beside the text, never
  the text itself - and no button in this file is red, bordered red, or filled.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { prefersReducedMotion } from "svelte/motion";
  import { fade } from "svelte/transition";
  import { TURN_IT_DOWN } from "$lib/tune/copy";

  /**
   * The two shapes slot B renders, declared structurally rather than imported.
   *
   * $lib/tune/model is reached only through `await import()` (D-18), and this
   * component names exactly the fields it renders and no others - so a
   * `LadderView` and an `OverBudgetView` are each assignable to the prop below
   * and the compiler checks that at the region's call site. It is the
   * src/lib/sim/host.ts HostEngine pattern: a structural declaration, no import
   * either way, and no file shared between the two.
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
          class="back-off"
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
  /*
    Auto height, and it takes no space at all when there is nothing to say -
    which is every state a visitor can actually reach.
  */
  .slot:not(:empty) {
    margin-block-start: 16px;
  }

  /* 2px left rule, 12px of inline padding. The rule's colour says which. */
  .block {
    border-inline-start: 2px solid var(--color-line);
    padding-inline-start: 12px;
  }

  /* X-01 use 3 of 3, and the only red in this file. */
  .block.over {
    border-inline-start-color: var(--color-over);
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

  /*
    Phase 4's secondary treatment at 44px, and it is deliberately NOT red: the
    token is scoped to the meter and to the rule beside this block, and a red
    button would read as "dangerous" where the truth is "not yet".
  */
  .back-off {
    appearance: none;
    inline-size: fit-content;
    min-block-size: 44px;
    margin-block-start: 8px;
    padding-inline: 16px;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
    cursor: pointer;
    transition:
      border-color 140ms ease-out,
      color 140ms ease-out;
  }

  .back-off:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
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
