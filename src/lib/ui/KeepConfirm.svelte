<!--
  The inline flash confirmation - the only confirmation on the site
  (07-UI-SPEC, The inline flash confirmation; SAFE-05, SAFE-06; D-15, Z-01).

  Rendered by the panel while install.confirmOpen, IN PLACE OF the row's KEEP
  ON DEVICE, so there is never a second KEEP ON DEVICE on the screen: the row's
  quiet control opens this block, this block's bordered control commits, and
  the two are never rendered together (WCAG 2.5.3 - a speech-input user saying
  "click KEEP ON DEVICE" is never ambiguous). The cell above it, PUT BACK, does
  not move. It reads two singletons and takes one prop, `onclose`, which the
  panel implements as install.dismissConfirm() followed by a focus move back
  to the row's KEEP ON DEVICE. Every word is install-copy's.

  WHY THE CONTAINER IS THE FOCUS TARGET, NOT EITHER BUTTON. On mount focus
  moves to the block itself - tabindex="-1", role="group", labelled by the
  PERMANENT caption and described by its sentences. That puts the naming
  sentence, the one that says what is replaced and that it survives a power
  cycle, at the top of what assistive technology reads; and it means NO KEY
  PRESS COMMITS WITHOUT A DELIBERATE MOVE - the first Tab reaches the
  affirmative, Enter on the block itself does nothing. A confirmation whose
  affirmative took focus would let the Enter that opened it be the Enter that
  stored to flash.

  WHY IT IS NOT A DIALOG. No role="dialog", no aria-modal, no inert background,
  no focus trap. Phase 6 ruled that a disclosure is not a dialog and the same
  holds here: the block is inline in the panel, the rest of the panel stays
  valid and reachable, and Tab walks out of it in DOM order. A modal would
  claim the whole page for a decision that concerns one control.

  WHY FOCUS LEAVING DOES NOT CLOSE IT. Phase 6's disclosure closes when focus
  leaves, because a disclosure is reading material and closes when you stop
  reading it. This is a PENDING DECISION, and it must still be there when the
  visitor comes back to it - a reader who tabs out to check the knobs and
  tabs back should find the question where they left it. The exits are
  deliberate: NOT NOW, Escape inside the block, a knob move and a session drop
  (the last two are the store's, in observeConfig and onConnection).

  WHY THE AFFIRMATIVE IS BORDERED AND NEVER ACCENT-FILLED. The accent fill
  means "this is the live control" and it is on exactly one control per
  screen, TRY ON DEVICE. An accent-filled KEEP ON DEVICE inside this block
  would be a second primary on the same panel at the exact moment the site is
  asking somebody to do the irreversible thing - it would out-shout the RAM
  audition and invert SAFE-02's hierarchy. So it is the secondary tier: a
  hairline border and a full-ink label. NOT NOW beside it is the quiet tier.

  WHY THERE IS NO COLOUR ON THIS BLOCK (Z-01, one sentence each). A colour
  would carry nothing the sentence does not already carry, because this block
  is text and layout end to end and its first sentence already says "survives
  a power cycle". Reusing the alarm red would overload the one thing it means
  on this same panel, where 200px away it means "over 908 characters". A
  fourth hue would break identity.spec.ts's guard for a use that is
  decorative, and that guard is worth spending only on something that cannot
  be said any other way. And the site's own precedent - the red is never a
  button fill, never a button border, never on TRY ON DEVICE - points the same
  way, because a red here would say "dangerous" when the truth is
  "deliberate". What carries the warning instead is copy (PERMANENT and the
  naming sentence), weight (the caption is the one on this site rendered at
  full ink rather than quiet, the only strength escalation in the phase) and
  layout (a bordered block that replaces the control that opened it).

  The rig sentence (SAFE-06) renders only when the session's identity carries
  other modules, already in sx-then-sy order from Phase 6's fold; a module that
  named no type is listed as "module". install-copy's confirmRig returns
  undefined for none, so there is no empty fourth paragraph and
  aria-describedby lists two ids rather than three.

  The block fades IN over 160ms of opacity, CSS only, instant under reduced
  motion. Its leaving is the panel's, at the {#if} that mounts it (plan 07-10).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    CONFIRM_CAPTION,
    CONFIRM_REPLACES,
    CONFIRM_WAY_BACK,
    KEEP_LABEL,
    NOT_NOW_LABEL,
    confirmRig,
  } from "$lib/device/install-copy";

  let {
    onclose,
  }: {
    /**
     * NOT NOW and Escape land here. The panel closes the store's confirmation
     * and returns focus to the row's KEEP ON DEVICE, which it re-renders in
     * this block's place.
     */
    onclose: () => void;
  } = $props();

  const uid = $props.id();
  const captionId = `${uid}-caption`;
  const replacesId = `${uid}-replaces`;
  const wayBackId = `${uid}-way-back`;
  const rigId = `${uid}-rig`;

  /** The other modules on the cable, by type, in the fold's order. */
  const others = $derived(
    session.identity?.otherModules.map((m) => m.moduleType ?? "module") ?? [],
  );
  const rig = $derived(confirmRig(others));
  /** Sentences 2 and 3, and 4 when it exists. */
  const sentenceIds = $derived(
    rig ? `${replacesId} ${wayBackId} ${rigId}` : `${replacesId} ${wayBackId}`,
  );

  /** The programmatic focus target. */
  let container = $state<HTMLDivElement | null>(null);

  onMount(() => {
    container?.focus();
  });

  /**
   * Escape INSIDE the block dismisses it. Handled at the window rather than
   * on the container, so the group carries no key handler of its own; it acts
   * only while focus is inside the block.
   */
  function onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    if (!container || !container.contains(event.target as Node)) return;
    event.stopPropagation();
    onclose();
  }

  function keep(): void {
    void install.keepOnDevice();
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div
  bind:this={container}
  class="keep-confirm"
  role="group"
  tabindex="-1"
  aria-labelledby={captionId}
  aria-describedby={sentenceIds}
  data-testid="keep-confirm"
>
  <p class="caption" id={captionId}>{CONFIRM_CAPTION}</p>
  <p class="body" id={replacesId}>{CONFIRM_REPLACES}</p>
  <p class="body quiet" id={wayBackId}>{CONFIRM_WAY_BACK}</p>
  {#if rig}
    <p class="body quiet" id={rigId}>{rig}</p>
  {/if}
  <div class="actions">
    <button
      class="secondary pill"
      type="button"
      data-testid="keep-confirm-yes"
      onclick={keep}
    >
      {KEEP_LABEL}
    </button>
    <button
      class="quiet-control"
      type="button"
      data-testid="keep-confirm-no"
      onclick={onclose}
    >
      {NOT_NOW_LABEL}
    </button>
  </div>
</div>

<style>
  /*
    The block: a hairline, the black ground, 16px inside, 8px between its
    children. No shadow, no glow, no backdrop, no fill (07-UI-SPEC), and no
    corner (D-01; the 10px went in 13-11 and the allowlist row with it). The
    fade is opacity alone and never height.
  */
  .keep-confirm {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    inline-size: 100%;
    padding: 16px;
    border: 1px solid var(--color-boundary);
    background: var(--color-workspace);
    animation: fade-in 160ms linear;
  }

  .keep-confirm:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /*
    Micro, uppercase, at FULL ink: the one caption on the site at this
    strength (07-UI-SPEC, Color - the declared exception). Not a heading.
  */
  .caption {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
  }

  /* Body role. The first sentence at full ink; the rest quiet. */
  .body {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .quiet {
    color: var(--color-ink-quiet);
  }

  /* 16px before the action row: the column's 8px gap plus 8px here. */
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-block-start: 8px;
  }

  /*
    The affirmative: secondary tier, bordered, never filled - and all three of
    those are src/app.css's .pill since A-41, applied by the class on the button
    rather than restated here. The 44px floor stays: it is this control's, not
    the shape's. Auto width, the
    44px floor on both axes, Micro label at full ink. The hover colour is the
    one transition.
  */
  .secondary {
    appearance: none;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink);
    cursor: pointer;
    transition:
      color 140ms ease-out,
      border-color 140ms ease-out;
  }

  .secondary:hover {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  /*
    NOT NOW: quiet tier. No border, no fill, no inline padding, the label
    quiet until hovered. It undoes; it does not act.
  */
  .quiet-control {
    appearance: none;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 0;
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .quiet-control:hover {
    color: var(--color-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .keep-confirm {
      animation: none;
    }

    .secondary,
    .quiet-control {
      transition: none;
    }
  }
</style>
