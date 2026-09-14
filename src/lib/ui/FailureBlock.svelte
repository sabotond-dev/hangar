<!--
  The one failure block: title, detail, ordered steps, so no two surfaces word a
  failure differently or set it in two type scales. Props: block ({ title?, detail,
  steps }, declared structurally, never imported from the transport - a leaf that
  names exactly the fields it renders; the title is optional because the S5
  sentence and the already-connecting row have none), testid. Renders in one
  place at a time (Y-11); the control label in every step is the surface's,
  interpolated by the session's failureFor(label) - this file authors no sentence.
  No heading, no control, no tab stop; an empty steps renders no list at all.
  Decided at 06-12 (06-UI-SPEC Y-11, Y-13); see .planning/phases/06-device-session/06-12-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  let {
    block,
    testid = "failure-block",
  }: {
    /** Structurally declared: { title?, detail, steps }. Never imported from the transport. */
    block: { title?: string; detail: string; steps: readonly string[] };
    /** The mounting surface may name its own id, so two mounts stay distinguishable in a test. */
    testid?: string;
  } = $props();
</script>

<div class="failure-block" data-testid={testid}>
  {#if block.title}
    <p class="title">{block.title}</p>
  {/if}
  <p class="detail">{block.detail}</p>
  {#if block.steps.length > 0}
    <ol class="steps">
      {#each block.steps as step (step)}<li>{step}</li>{/each}
    </ol>
  {/if}
</div>

<style>
  /* Micro (title): 12px / 600, sentence case, nearly no tracking - a failure title reads as a sentence. */
  .title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    color: var(--color-ink);
  }

  /* Body role at full strength: this is what the visitor is here to read. */
  .detail {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .title + .detail {
    margin-block-start: 8px;
  }

  /* Body, quiet, a real decimal list: the way out, in order. */
  .steps {
    margin: 8px 0 0;
    padding-inline-start: 24px;
    list-style: decimal;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }
</style>
