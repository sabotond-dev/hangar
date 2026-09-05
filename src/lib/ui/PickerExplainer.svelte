<!--
  CONN-03's pre-click explanation: what the browser's picker is, that the
  browser asks and not HANGAR, and that HANGAR sees nothing until the visitor
  chooses (06-UI-SPEC, The header note; Y-09).

  ONE COMPONENT, TWO MOUNTS, NEVER BOTH AT ONCE (Y-11). The header note renders
  it in S1 and S7 while no panel is open; the chosen panel renders it in its
  connect-state region while it is open (plan 06-12). When the panel has it,
  the note keeps this component as a hidden sizing twin so its height does not
  move - see DeviceNote.svelte - and only the visible one is read. The two
  mounts can name their own testid so a test tree tells them apart.

  IT IS ONE BODY PARAGRAPH AND NOTHING ELSE. No heading, no control, no tab
  stop, no icon: it is prose under a control, and the control it explains is
  the one that connects. The Firefox two-step sentence is deliberately NOT
  here - it is actionable only once a visitor has seen no list, so it lives
  beneath `Nothing listed?` in the cancelled block (Y-09), and the note stays
  at two paragraphs.

  THE SENTENCE IS session-copy's, INTERPOLATED, NEVER RETYPED. Prettier reflows
  element text and Phase 2 lost a load-bearing sentence to exactly that; the
  130 characters are asserted in session-copy.spec.ts against the contract, so
  this file carries no words of its own. Its one specifier is on the chunk
  guard's permitted list (src/lib/config-shape.spec.ts test 13): session-copy
  imports nothing, so a header component may name it on the first paint of /.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { PICKER_EXPLAINER } from "$lib/device/session-copy";

  let {
    testid = "picker-explainer",
  }: {
    /** The mounting surface may name its own id, so the note's and the panel's mounts stay distinguishable. */
    testid?: string;
  } = $props();
</script>

<p class="explainer" data-testid={testid}>{PICKER_EXPLAINER}</p>

<style>
  /* Body role, quiet: 16px / 400 / 1.5, the honesty slot's own treatment. */
  .explainer {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }
</style>
