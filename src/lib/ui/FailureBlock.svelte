<!--
  The one failure block (06-UI-SPEC, The failure states; Y-11, Y-13).

  Title, detail, ordered steps - the markup TryOnDevice.svelte has rendered
  for every failure since Phase 4, lifted into a component so the header
  disclosure and the chosen panel cannot word the same failure differently or
  set it in two type scales. The three text treatments below (.title, .detail,
  .steps) are copied from TryOnDevice.svelte declaration for declaration
  rather than rewritten, so the two surfaces cannot drift while both exist.

  TWO RULES MAKE IT ONE COMPONENT.

  1. IT RENDERS IN ONE PLACE AT A TIME. In the chosen panel while the panel is
     open, in the header disclosure otherwise - never in both at once. A
     visitor reading the six-step recovery for a held port twice, in two
     places, in two sizes, is worse off than reading it once.

  2. THE CONTROL LABEL IS THE RENDERING SURFACE'S. Every step that says "Click
     ... again" names the button on the surface showing it - CONNECT ZONA in
     the header, TRY ON DEVICE in the panel - which is why this takes a
     fully-formed `block` rather than a failure key: the session's
     failureFor(label) has already done the interpolation, and this component
     authors no sentence and looks nothing up.

  THE SHAPE IS DECLARED, NOT IMPORTED. { title?, detail, steps } is written out
  below in the Phase 5 leaf-component way (BudgetMessage.svelte), and the
  reason is stronger than the first-paint chunk guard: a leaf that declares
  exactly the fields it renders cannot be broken by a change to a module it
  never names, and its title is OPTIONAL where the transport's FailureCopy has
  a required one - the S5 sentence and the already-connecting row have a
  detail and no title, and both render here without a second component.

  NO HEADING, NO CONTROL, NO TAB STOP. Titles are Micro (title) paragraphs, as
  Phase 4 set them: a disclosure is not a document section (06-UI-SPEC,
  Accessibility Contract). An empty `steps` renders no list at all rather than
  an empty <ol>, which is the already-open row and the S5 sentence.

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
  /*
    Micro (title): 12px / 600, sentence case and nearly no tracking. Failure
    and state titles read as sentences, and a sentence in wide-tracked
    uppercase is shouting rather than labelling. (TryOnDevice.svelte)
  */
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
