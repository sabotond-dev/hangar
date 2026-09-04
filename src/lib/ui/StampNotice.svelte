<!--
  Message slot A: how this panel arrived, said once.

  Three landings have something to say and one does not. A link with no stamp
  lands on the base configuration and needs no sentence, because nothing
  happened that a visitor could not see. A stamp that decoded says so and names
  the control that undoes it. A stamp that did not decode says so and names the
  configuration, so the visitor knows what they are looking at instead.

  WHY "OLDER" AND "UNREADABLE" ARE TWO SENTENCES, ONE CONDITION APART. Asserting
  "made with an older version" about a stamp that is simply corrupt would be a
  small lie, and this site does not tell those. $lib/share/stamp decides which
  is true - `older` is reachable only where the format letter is known and its
  shape character disagrees - and this component prints whichever it was handed.
  Both land on the base configuration, and neither is ever a partial restore
  (D-13).

  ROLE="STATUS", AND WHY IT IS SAFE HERE. The notice is announced after
  hydration rather than from a container that was already live at first render,
  which is what an assertive region or a live container present at load would
  get wrong. It is the one live thing in slot A; the region's single polite
  live region (05-10) is a different thing with a different job and does not
  duplicate this.

  THIS COMPONENT DOES NOT REMOVE ITSELF. The notice disappears on the first knob
  change or on RESET ALL - it describes how the panel arrived, and once the
  visitor has taken over it is no longer true - but that is the REGION's job,
  not this file's: the region is what knows a knob moved. Handed `none`, this
  renders nothing; handed anything else, it renders until it is not.

  SLOT A'S HEIGHT IS SETTLED AT LANDING, before the panel is ever visible, so
  nothing beneath it moves afterwards. There is no appearance transition here
  for that reason: nothing to fade in from, because it was already there.

  No --color-over appears in this file. The token is scoped to X-01's three
  uses, all of them in BudgetMeter.svelte and BudgetMessage.svelte, and an
  unreadable link is not an alarm - it is a fact stated plainly.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { STAMP_RESTORED, stampOlder, stampUnreadable } from "$lib/tune/copy";

  /**
   * The landing, structurally: $lib/share/stamp's `Landing["kind"]`, declared
   * here rather than imported because that module reaches the vendored compiler
   * and this one may not name it (D-18, config-shape.spec.ts test 13). A
   * `Landing["kind"]` is assignable to this union and the compiler checks that
   * at the region's call site.
   */
  type LandingKind = "none" | "restored" | "older" | "unreadable";

  let {
    kind,
    name,
  }: {
    /** Which of the three landings, or none. */
    kind: LandingKind;
    /** The configuration's name, which two of the three sentences carry. */
    name: string;
  } = $props();

  /** Undefined for `none`, and the component then renders nothing at all. */
  const line = $derived(
    kind === "restored"
      ? STAMP_RESTORED
      : kind === "older"
        ? stampOlder(name)
        : kind === "unreadable"
          ? stampUnreadable(name)
          : undefined,
  );
</script>

<div class="slot" data-testid="stamp-notice" role="status">
  {#if line}
    <p class="line">{line}</p>
  {/if}
</div>

<style>
  /*
    Empty for the `none` landing, and it costs nothing then: the container is
    always in the DOM so that the status role is attached before anything is
    announced through it, and it takes no space until it has a sentence.
  */
  .slot:not(:empty) {
    margin-block-end: 16px;
  }

  /* Body role at full strength, with the 2px structural left rule. */
  .line {
    margin: 0;
    border-inline-start: 2px solid var(--color-line);
    padding-inline-start: 12px;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }
</style>
