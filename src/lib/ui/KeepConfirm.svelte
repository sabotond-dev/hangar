<!--
  The inline flash confirmation, the only confirmation on the site: rendered by
  DestinationZone.svelte while install.confirmOpen, IN PLACE OF its Store on ZONA,
  so the two are never on the screen together (WCAG 2.5.3). Three props: config
  and name (what the affirmative hands install.keepOnDevice, 2026-09-16) and
  onclose (NOT NOW and Escape; the zone dismisses and moves focus back). Focus
  lands on the block itself (tabindex="-1", role="group"), never on a button: no
  key press commits without a deliberate move. Not a dialog, no trap; focus leaving
  does not close a pending decision. The affirmative is bordered, never filled; no
  colour on the block - the red means one thing on this panel (Z-01). Every word is
  install-copy's; CONFIRM_WAY_BACK names the header's Clear.
  Decided at 07-10 (07-UI-SPEC D-15, Z-01; 13.1-CONTEXT D-07); see .planning/phases/07-install-flow/07-10-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    CONFIRM_WAY_BACK,
    KEEP_LABEL,
    NOT_NOW_LABEL,
    confirmCaption,
    confirmReplaces,
    confirmRig,
  } from "$lib/device/install-copy";

  let {
    config,
    name,
    onclose,
  }: {
    /** The five strings the affirmative writes and stores - the zone's own prop, or undefined while the caller measures. */
    config?:
      | {
          systemTimer: string;
          system: string;
          systemUtility: string;
          setup: string;
          timer: string;
        }
      | undefined;
    /** The store's label for the write: the entry's or the surface's name. */
    name: string;
    /** NOT NOW and Escape land here: the zone closes the store's confirmation and returns focus to its Store on ZONA. */
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
  /** The page the confirmation names, as the module reports it (the copy adds one); the confirmation opens only while the store is armed, so a snapshot exists. */
  const page = $derived(install.snapshotPage ?? 0);
  /** Sentences 2 and 3, and 4 when it exists. */
  const sentenceIds = $derived(
    rig ? `${replacesId} ${wayBackId} ${rigId}` : `${replacesId} ${wayBackId}`,
  );

  /** The programmatic focus target. */
  let container = $state<HTMLDivElement | null>(null);

  onMount(() => {
    container?.focus();
  });

  /** Escape INSIDE the block dismisses it; handled at the window so the group carries no key handler. */
  function onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    if (!container || !container.contains(event.target as Node)) return;
    event.stopPropagation();
    onclose();
  }

  function keep(): void {
    void install.keepOnDevice(config, name);
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
  <p class="caption" id={captionId}>{confirmCaption(page)}</p>
  <p class="body" id={replacesId}>{confirmReplaces(page)}</p>
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
  /* The block: a hairline, the black ground, 16px inside, 8px between children; no glow, no fill, no corner (D-01); the fade is opacity alone. */
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

  /* The title at FULL ink, the one caption on the site at this strength (07-UI-SPEC); a sentence since 13-18 (D-23), sentence case at Body size. Not a heading. */
  .caption {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0.01em;
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

  /* The affirmative: secondary tier - bordered, never filled - is src/app.css's .pill (A-41); the 44px floor on both axes is this control's, Micro label at full ink. */
  .secondary {
    appearance: none;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
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

  /* NOT NOW: quiet tier, no fill, no inline padding, the label quiet until hovered. */
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
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
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
