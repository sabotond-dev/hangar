<!--
  The device disclosure: the panel under the footer's Device actions label, in the
  five states that have one - S0a, S0b, S4, S5, S6 by slotStateOf(session.phase).
  Props: open (device-drawer.svelte.ts's, written by the two openers), panelOwnsProse
  (Y-11: never rendered while the chosen panel has the session's prose), onclose
  (the four close paths: Escape, focus leaving, a click outside, a state with no
  disclosure), opener (where focus goes back). A disclosure, not a dialog: no role,
  no trap, no backdrop; the container is a programmatic focus target only. DISCONNECT
  ZONA and FORGET THIS ZONA are a real disabled under the writeLock the install store
  raises while it writes (Z-15); the slot never shows an install state. Strings: session-copy.
  Decided at 06-13 / 13-11; see .planning/phases/13-gui-overhaul/13-11-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { install } from "$lib/device/install.svelte";
  import { session } from "$lib/device/session.svelte";
  import {
    CHOOSER_NEVER_APPEARED,
    CHOOSER_NEVER_APPEARED_BODY,
    CONNECT_LABEL,
    DISCONNECT_LABEL,
    FORGET_LABEL,
    NOTHING_LISTED,
    NOTHING_LISTED_STEPS,
    PERMISSION_DECLINED,
    REPLUG_OFFER,
    REVOKE_EXPLANATION,
    SNAPSHOT_DURABLE_LINE,
    SNAPSHOT_SESSION_LINE,
    TWO_STEP,
    UNPLUGGED_WHILE_CONNECTED,
    WRITE_LOCK_REASON,
    identitySentence,
    multiModuleLine,
    slotStateOf,
  } from "$lib/device/session-copy";
  import { OPENER_SELECTOR } from "./device-drawer.svelte";
  import FailureBlock from "./FailureBlock.svelte";

  let {
    open,
    panelOwnsProse = false,
    onclose,
    opener = null,
  }: {
    /** Whether the drawer is rendered at all: device-drawer.svelte.ts's state, the one source of truth. */
    open: boolean;
    /** True while the chosen panel is rendering the session's prose (Y-11): the drawer never opens while it is true. */
    panelOwnsProse?: boolean;
    /** Escape, focus leaving, a click outside, and a transition into S1, S2 or S7 all call this. */
    onclose: () => void;
    /** The opener's element, where focus goes back when nothing else had it: on the S6 road the slot was disabled and blurred, so activeElement is the body (06-13). */
    opener?: HTMLElement | null;
  } = $props();

  const slot = $derived(slotStateOf(session.phase));

  /** The five states that render a disclosure; every other one renders nothing. */
  const rendered = $derived(
    open &&
      !panelOwnsProse &&
      (slot === "S0a" ||
        slot === "S0b" ||
        slot === "S4" ||
        slot === "S5" ||
        slot === "S6"),
  );

  const failure = $derived(session.failureFor(CONNECT_LABEL));
  const identity = $derived(session.identity);
  const others = $derived(
    identity ? identity.otherModules.map((m) => m.moduleType ?? "unknown") : [],
  );
  const identityLine = $derived(
    identity
      ? identitySentence(identity.zona.firmware, identity.activePage)
      : "",
  );
  const multiLine = $derived(multiModuleLine(others));

  /** The snapshot line's form (the record is in this browser, or this tab's alone); rendered only while a snapshot is in hand. */
  const snapshotLine = $derived(
    install.snapshotDurable ? SNAPSHOT_DURABLE_LINE : SNAPSHOT_SESSION_LINE,
  );

  /** The lock's reason line, named by both disabled controls through aria-describedby; unique per mount. */
  const uid = $props.id();
  const lockId = `${uid}-write-lock`;

  /** The container, a programmatic focus target only. */
  let container = $state<HTMLDivElement | null>(null);
  /** The element focused just before the drawer opened - the slot - restored on Escape. */
  let previouslyFocused: HTMLElement | null = null;

  /**
   * On open, remember what had focus; in S6 the arriving failure opened the drawer, so
   * focus moves into the recovery. The panel sits under a viewport-sized frame (13-05),
   * so it is scrolled into view on open, nearest edge, for the four summary states.
   */
  let wasRendered = false;
  $effect(() => {
    if (rendered && !wasRendered) {
      const active =
        typeof document !== "undefined"
          ? (document.activeElement as HTMLElement | null)
          : null;
      // The body is what a blurred disabled slot leaves behind: fall back to the slot.
      previouslyFocused =
        active && active !== document.body ? active : (opener ?? active);
      container?.scrollIntoView({ block: "nearest" });
      if (slot === "S6") container?.focus();
    }
    wasRendered = rendered;
  });

  /** A click outside closes. Attached on the next frame (so the opening click does not close it) and in the capture phase. */
  $effect(() => {
    if (!rendered) return;
    let attached = false;
    const onDocPointerDown = (event: MouseEvent) => {
      if (!container) return;
      const target = event.target as Node | null;
      if (!target || container.contains(target)) return;
      // An opener's click is the toggle's business, never a close first.
      if (isOpener(target)) return;
      onclose();
    };
    const raf = requestAnimationFrame(() => {
      document.addEventListener("pointerdown", onDocPointerDown, true);
      attached = true;
    });
    return () => {
      cancelAnimationFrame(raf);
      if (attached)
        document.removeEventListener("pointerdown", onDocPointerDown, true);
    };
  });

  /** Escape closes and returns focus to the slot; handled at the window so the container carries no keydown handler (a disclosure is not a dialog). */
  function onWindowKeydown(event: KeyboardEvent): void {
    if (!rendered) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      onclose();
      previouslyFocused?.focus();
    }
  }

  /** True for either of the panel's two openers, by the aria-controls they carry. */
  function isOpener(node: Node): boolean {
    const el = node instanceof Element ? node : node.parentElement;
    return el !== null && el.closest(OPENER_SELECTOR) !== null;
  }

  function onFocusout(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!container) return;
    if (next !== null && (container.contains(next) || isOpener(next))) return;
    onclose();
  }

  async function disconnect(): Promise<void> {
    const slotEl = previouslyFocused;
    await session.disconnect();
    slotEl?.focus();
  }

  async function forget(): Promise<void> {
    const slotEl = previouslyFocused;
    await session.forget();
    slotEl?.focus();
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if rendered}
  <div
    bind:this={container}
    class="device-details"
    data-testid="device-details"
    data-slot={slot}
    tabindex="-1"
    onfocusout={onFocusout}
  >
    {#if (slot === "S0a" || slot === "S0b" || slot === "S6") && failure}
      <FailureBlock block={failure} />
    {/if}

    {#if slot === "S6" && session.phase === "cancelled"}
      <details class="branch" data-testid="nothing-listed">
        <summary class="summary">{NOTHING_LISTED}</summary>
        <ol class="steps">
          {#each NOTHING_LISTED_STEPS as step (step)}<li>{step}</li>{/each}
        </ol>
      </details>
      <details class="branch" data-testid="chooser-never-appeared">
        <summary class="summary">{CHOOSER_NEVER_APPEARED}</summary>
        <p class="body">{CHOOSER_NEVER_APPEARED_BODY}</p>
      </details>
      <p class="body">{TWO_STEP}</p>
      {#if session.permissionDeclined}
        <p class="body">{PERMISSION_DECLINED}</p>
      {/if}
    {/if}

    {#if slot === "S4"}
      <p class="body">{identityLine}</p>
      {#if multiLine}<p class="body">{multiLine}</p>{/if}
      {#if install.snapshot !== undefined}
        <p class="body quiet" data-testid="snapshot-line">{snapshotLine}</p>
      {/if}
      <!-- The lock (Z-15): a real disabled on both controls while the session's writeLock is on, the reason line beneath as their description. SAFE_PROMISE is retired (10-03, R-03). -->
      <button
        type="button"
        class="action"
        data-testid="details-disconnect"
        disabled={session.writeLock}
        aria-describedby={session.writeLock ? lockId : undefined}
        onclick={disconnect}>{DISCONNECT_LABEL}</button
      >
      {#if session.canForget}
        <div class="revoke">
          <p class="body">{REVOKE_EXPLANATION}</p>
          <button
            type="button"
            class="action"
            data-testid="details-forget"
            disabled={session.writeLock}
            aria-describedby={session.writeLock ? lockId : undefined}
            onclick={forget}>{FORGET_LABEL}</button
          >
        </div>
      {/if}
      {#if session.writeLock}
        <p class="body quiet" id={lockId} data-testid="write-lock-reason">
          {WRITE_LOCK_REASON}
        </p>
      {/if}
    {/if}

    {#if slot === "S5"}
      <p class="body">{UNPLUGGED_WHILE_CONNECTED}</p>
      <p class="body">{REPLUG_OFFER}</p>
      {#if session.canForget}
        <button type="button" class="action" onclick={forget}
          >{FORGET_LABEL}</button
        >
      {/if}
    {/if}
  </div>
{/if}

<style>
  /* Non-modal, in the footer's panel row (13-11): a plain block, no glow, no backdrop tint, no corner (D-01); the reading measure wide, at the footer's right. */
  .device-details {
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: 560px;
    margin-inline-start: auto;
    padding-block: 8px 16px;
    text-align: start;
  }

  .device-details:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  /* Body role: the words the visitor is here to read. */
  .body {
    margin: 0;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  /* The snapshot line and the lock's reason: Body, one rung quieter. */
  .quiet {
    color: var(--color-ink-quiet);
  }

  /* The two session-ending actions: wide-tracked uppercase labels on the 44px floor, quiet until hovered, no fill; a real disabled in the dim rung under the lock. */
  .action {
    appearance: none;
    display: inline-flex;
    align-items: center;
    align-self: start;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding: 0 4px;
    border: 0;
    background: transparent;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 160ms ease-out;
  }

  .action:hover:not(:disabled),
  .action:focus-visible {
    color: var(--color-ink);
  }

  .action:disabled {
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }

  .revoke {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* The two recovery questions: real disclosures, the summary on the 44px floor. */
  .branch {
    margin: 0;
  }

  .summary {
    display: flex;
    align-items: center;
    min-block-size: 44px;
    min-inline-size: 44px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--color-ink-quiet);
    cursor: pointer;
  }

  .summary:focus-visible {
    outline: 2px solid var(--color-action);
    outline-offset: 4px;
  }

  .branch .steps,
  .branch .body {
    margin-block-start: 8px;
  }

  .steps {
    margin-block: 0;
    padding-inline-start: 24px;
    list-style: decimal;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink-quiet);
  }

  @media (prefers-reduced-motion: reduce) {
    .action {
      transition: none;
    }
  }
</style>
