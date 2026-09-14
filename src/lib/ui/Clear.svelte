<!--
  CLEAR: the header's control, top right, 12px left of the connection control,
  on every page and both header variants (the user's "all the time"). No props;
  it reads the session and the install store. ONE CLICK SENDS, no confirmation
  (D-04): install.clearToDefault() writes the firmware's own defaults (Setup 641,
  Timer 22, by event number - not emptiness) and then the same ACK-gated store
  leg as Store on ZONA (round 4c). Disabled with its reason, never hidden
  (DEGR-02): the caption is install-copy's closed record of three, held through a
  write and a pending page target; the sr-only description is never conditional.
  The box is DeviceSlot's: 44px both axes, two 14px fixed lines; nothing transitions.
  Decided at 13.1-05 (13.1-CONTEXT D-04); see .planning/phases/13.1-bench-corrections-four/13.1-05-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install } from "$lib/device/install.svelte";
  import {
    CLEAR_LABEL,
    CLEAR_REASONS,
    clearLine,
    clearingLabel,
    type ClearReason,
  } from "$lib/device/install-copy";
  import { session } from "$lib/device/session.svelte";

  /** The session can write at all: its two capability phases say no. */
  const capable = $derived(
    session.phase !== "unsupported" && session.phase !== "insecure",
  );
  /** Why the control is disabled, or undefined when it is live - the store's one rule. */
  const reason = $derived(install.clearReason(capable));
  const writing = $derived(install.phase === "writing");
  /** The busy label belongs to a clear and to nothing else, through both its legs (the RAM writes, then the store and its proof). */
  const busy = $derived(writing && install.action === "clear");
  /** 13-12: and the page target at rest - the store's one condition, mirrored; clearEnabled() refuses too. */
  const pending = $derived(
    session.phase === "connected" && !install.applyReady,
  );
  const disabled = $derived(reason !== undefined || writing || pending);

  /** The reason on screen, held through a write: clearReason() reads no-session while writing, which would be false and noise. The effect writes it and never reads it. */
  let held = $state<ClearReason | undefined>(undefined);
  $effect(() => {
    if (install.phase !== "writing" && !pending) held = reason;
  });
  /* Held through a pending page target too (13-12): the destination zone carries that state's line. */
  const shown = $derived(writing || pending ? held : reason);

  /** The page the description and the busy label name, as the module reports it (the copy adds one); 0 is never read before a snapshot exists. */
  const page = $derived(install.snapshotPage ?? 0);

  /** The caption: the shown reason from the closed record, or nothing when live. */
  const caption = $derived(shown === undefined ? "" : CLEAR_REASONS[shown]);
  /** The description: what the click restores when live, the reason when not. */
  const description = $derived(
    shown === undefined ? clearLine(page) : CLEAR_REASONS[shown],
  );

  function clear(): void {
    void install.clearToDefault();
  }
</script>

<div class="clear" data-testid="clear-control">
  <button
    class="control"
    type="button"
    data-testid="clear"
    {disabled}
    aria-busy={busy ? "true" : undefined}
    aria-describedby="clear-line"
    onclick={clear}
  >
    <span class="lines">
      <span class="label" data-testid="clear-label"
        >{busy ? clearingLabel(page) : CLEAR_LABEL}</span
      >
      <span class="caption" data-testid="clear-caption" aria-hidden="true"
        >{caption}</span
      >
    </span>
  </button>
  <span id="clear-line" class="sr-only" data-testid="clear-line"
    >{description}</span
  >
</div>

<style>
  .clear {
    display: flex;
    align-items: center;
  }

  /* DeviceSlot.svelte's box: 44px on both axes, 16px inline padding, the boundary token as the border (identity.spec.ts forbids the divider here), the workspace ground. No corner, no transition. */
  .control {
    appearance: none;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 16px;
    border: 1px solid var(--color-boundary);
    background: transparent;
    font-family: var(--font-sans);
    color: var(--color-ink);
    text-align: start;
    cursor: pointer;
  }

  /* Hover: the boundary to the action colour, instantly. */
  .control:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  /* Disabled: a real attribute; the label to the quiet rung. */
  .control:disabled {
    cursor: not-allowed;
  }

  .control:disabled .label {
    color: var(--color-ink-quiet);
  }

  /* Two stacked lines, each in a 14px fixed box (Y-10): the row cannot move with the state. */
  .lines {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* The label: the user's word, sentence case, at the connection control's size and one weight up. */
  .label {
    line-height: 14px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--color-ink);
  }

  /* The caption: the reason in DeviceSlot's caption register, one line; rendered only where the zone has room (the query beneath). */
  .caption {
    display: none;
    line-height: 14px;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--color-ink-quiet);
  }

  /*
    The room rule: the zone (Header.svelte's .connection, an inline-size container)
    must hold this box with its widest reason beside the widest connection control
    and the 12px gap. Measured in 13.1-05: the widest pair is 288.2 + 12 + 160.3 =
    460.5, rounded up to the next ten. Below it the reason lives in the description
    alone and the row never scrolls sideways.
  */
  @container (min-width: 480px) {
    .caption {
      display: inline;
    }
  }
</style>
