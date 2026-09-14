<!--
  The header's connection control: one control reading the session's nine states
  through slotStateOf(phase) - this file holds no phase list of its own. Prop:
  panelOwnsProse (Y-11). ONE RULE PRODUCES THE CONTRACT: the slot is a plain button
  whenever a click connects (S1, S2, S6, S7) and a summary whenever it does not (S0a,
  S0b, S4, S5 - aria-expanded from the closed list EXPANDS alone); S3 is disabled and
  busy. Two 14px fixed line boxes in a 44px box, so no state moves the header (Y-10).
  The accessible name is the label, the caption a describedby twin (WCAG 2.5.3). S6
  acts: the arriving failure opens the disclosure and moves focus into the recovery.
  The open state is device-drawer.svelte.ts's (13-11); the closing rules are written here.
  Decided at 06-10 / 13-11 (06-UI-SPEC Y-02, Y-10, Y-11); see .planning/phases/13-gui-overhaul/13-11-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    CAPTION_DETECTED,
    CAPTION_FAILED,
    CAPTION_INSECURE,
    CAPTION_UNPLUGGED,
    CAPTION_UNSUPPORTED,
    CONNECTED_LABEL,
    CONNECTING_LABEL,
    CONNECT_LABEL,
    HIDDEN_NAME_IDLE,
    PREVIEW_ONLY_LABEL,
    type SlotState,
    identityDescription,
    slotStateOf,
  } from "$lib/device/session-copy";
  import { PANEL_ID, drawer } from "./device-drawer.svelte";
  import DeviceMark from "./DeviceMark.svelte";

  let {
    panelOwnsProse = false,
  }: {
    /** True while a chosen panel renders the session's prose (Y-11): the disclosure never opens, and closes if open. */
    panelOwnsProse?: boolean;
  } = $props();

  /** A unique id for the describedby twin, so two mounts cannot collide. */
  const uid = $props.id();
  const descId = `${uid}-desc`;

  /**
   * The hydration marker, set ONLY here from onMount: a prerendered document carries
   * the slot without it, so a browser test can wait for a state prerendering cannot
   * satisfy (06-11, 06-13). Not a style hook; no component reads it.
   */
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });

  /** The button, where focus returns when the disclosure closes with nothing else focused (DeviceDetails' `opener`). */
  let control = $state<HTMLButtonElement | null>(null);

  /** aria-expanded appears in EXACTLY these four states, the summaries, and derives from this list alone. */
  const EXPANDS: readonly SlotState[] = ["S0a", "S0b", "S4", "S5"];

  /** The five states with a disclosure: the four summaries plus S6, whose disclosure the failure opens. */
  const DISCLOSES: readonly SlotState[] = [...EXPANDS, "S6"];

  const slot = $derived(slotStateOf(session.phase));
  const isSummary = $derived(EXPANDS.includes(slot));
  const isBusy = $derived(slot === "S3");

  /** True from a connecting click made HERE until the attempt settles; a fact about the last click, not reactive. */
  let armed = false;

  $effect(() => {
    // A state with no disclosure closes it (S3 included: a disclosure that survived S3 would
    // pop open on the connected identity unasked); a panel taking the prose closes it (Y-11).
    if (panelOwnsProse || !DISCLOSES.includes(slot)) drawer.open = false;
    // The arriving failure opens the disclosure, and only for a header click.
    if (slot === "S6" && armed && !panelOwnsProse) {
      drawer.opener = control;
      drawer.open = true;
    }
    if (slot !== "S3") armed = false;
  });

  const markShape = $derived.by(() => {
    switch (slot) {
      case "S2":
        return "detected" as const;
      case "S3":
        return "connecting" as const;
      case "S4":
        return "connected" as const;
      default:
        return "dark" as const;
    }
  });

  /** One line of text in every state since 13-18; kept as a data attribute for the tests that read it. */
  const labelKind = "text" as const;

  /** The verb where a click connects (S1, S2, S6, S7); the state where it does not (S0a, S0b, S5 - the summaries with no device); the identity in S4. */
  const labelText = $derived.by(() => {
    switch (slot) {
      case "S3":
        return CONNECTING_LABEL;
      case "S4":
        return CONNECTED_LABEL;
      case "S0a":
      case "S0b":
      case "S5":
        return PREVIEW_ONLY_LABEL;
      default:
        return CONNECT_LABEL; // S1, S2, S6, S7
    }
  });

  /** dim on the two terminal capability states, ink on the connected identity, quiet otherwise. */
  const labelTone = $derived.by(() => {
    if (slot === "S0a" || slot === "S0b") return "dim" as const;
    if (slot === "S4") return "ink" as const;
    return "quiet" as const;
  });

  const caption = $derived.by(() => {
    switch (slot) {
      case "S0a":
        return CAPTION_UNSUPPORTED;
      case "S0b":
        return CAPTION_INSECURE;
      case "S2":
        return CAPTION_DETECTED;
      case "S5":
        return CAPTION_UNPLUGGED;
      case "S6":
        return CAPTION_FAILED;
      default:
        return "";
    }
  });

  const identity = $derived(session.identity);

  /** The describedby twin: HIDDEN_NAME_IDLE where no ZONA is connected, the identity description in S4, the caption otherwise. */
  const description = $derived.by(() => {
    if (slot === "S1" || slot === "S7") return HIDDEN_NAME_IDLE;
    if (slot === "S4" && identity) {
      return identityDescription(identity.zona.firmware, identity.activePage);
    }
    return caption;
  });

  function handleClick(): void {
    if (isBusy) return;
    if (isSummary) {
      // Refuses to open while a panel owns the prose (DeviceDetails is the other guard).
      drawer.opener = control;
      drawer.open = !drawer.open && !panelOwnsProse;
      return;
    }
    armed = true;
    // Nothing awaited before connect(): requestPort() must run inside the click's activation window.
    session.connect();
  }
</script>

<button
  class="device-slot"
  type="button"
  data-testid="device-slot"
  data-slot={slot}
  data-hydrated={hydrated ? "true" : undefined}
  aria-describedby={descId}
  aria-expanded={isSummary ? drawer.open : undefined}
  aria-controls={isSummary ? PANEL_ID : undefined}
  aria-busy={isBusy ? "true" : undefined}
  disabled={isBusy}
  bind:this={control}
  onclick={handleClick}
>
  <DeviceMark shape={markShape} />
  <span class="lines">
    <span class="caption" data-testid="device-slot-caption" aria-hidden="true"
      >{caption}</span
    >
    <span
      class="label"
      data-testid="device-slot-label"
      data-kind={labelKind}
      data-tone={labelTone}
    >
      {labelText}
    </span>
  </span>
</button>
<span id={descId} class="sr-only">{description}</span>

<style>
  /* The PDF's box (pages 2-5): a 1px boundary on the workspace ground, the dot at the left. 44px on both axes in all nine states; the boundary token, not the divider (identity.spec.ts); no corner (D-01). */
  .device-slot {
    appearance: none;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 16px;
    border: 1px solid var(--color-boundary);
    background: var(--color-workspace);
    font-family: var(--font-sans);
    color: var(--color-ink);
    text-align: start;
    cursor: pointer;
    transition: border-color 160ms ease-out;
  }

  .device-slot:hover:not(:disabled),
  .device-slot[aria-expanded="true"] {
    border-color: var(--color-ink);
  }

  .device-slot:disabled {
    cursor: default;
  }

  /* Two stacked lines, each in a 14px fixed box (Y-10). */
  .lines {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* The caption: sentence case, quiet ink, ONE LINE - its box is a fixed 14px, and a wrapped caption would push the label to the floor (WebKit did, at 375 and 768, 13.1-05). */
  .caption {
    line-height: 14px;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--color-ink-quiet);
    transition: opacity 160ms ease-out;
  }

  /* The label: sentence case since 13-18 (D-23), at the connected identity's weight and size (Y-18). */
  .label {
    line-height: 14px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.01em;
    white-space: nowrap;
    color: var(--color-ink-quiet);
    transition:
      color 160ms ease-out,
      opacity 160ms ease-out;
  }

  .label[data-tone="dim"] {
    color: var(--color-ink-quiet);
  }

  .label[data-tone="ink"] {
    color: var(--color-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .device-slot,
    .caption,
    .label {
      transition: none;
    }
  }
</style>
