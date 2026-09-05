<!--
  The device disclosure: the quiet drawer behind the slot (06-UI-SPEC, Screen -
  the device disclosure; Y-11, Y-15).

  FIVE STATES, AND ONLY FIVE - S0a, S0b, S4, S5, S6. In S1, S2 and S7 the slot
  is a plain button that connects and its copy is inline in the header note, so
  there is no disclosure at all; S3 is only ever reached from those three, none
  of which can leave a drawer open, so an open drawer in S3 cannot occur. The
  state is read from slotStateOf(session.phase); this component holds no phase
  list of its own.

  ONE FAILURE, THREE CAUSES, TWO DISCLOSURES. The Web Serial API has exactly one
  post-prompt rejection (a NotFoundError) and Chromium reaches it from three
  different causes with the identical name and message: the visitor cancelled,
  the list was empty and they dismissed it, and serial is blocked for this site
  by a setting. The UI cannot tell them apart, so under `cancelled` it states
  the common case (the FailureBlock) and puts the other two one disclosure away
  each - "Nothing listed?" with the cable-and-driver steps, and "The chooser
  never appeared?" with the blocked-by-setting paragraph - followed by the
  two-step sentence, and the declined sentence only when the rejection was a
  NotAllowedError.

  THE never-both RULE IS TWO GUARDS ON ONE SIGNAL (Y-11). `panelOwnsProse` is
  true when the chosen panel is open and already rendering the session's prose.
  DeviceSlot refuses to set `open` while it is true; this component renders
  nothing while it is true even if `open` were somehow set. A drawer that opened
  behind an open panel would put the six-step recovery on screen twice, which is
  the exact double-reading Y-11 exists to prevent.

  IT IS A DISCLOSURE, NOT A DIALOG. No role="dialog", no focus trap, no backdrop,
  no modality. The container is a programmatic focus target only (tabindex="-1")
  so a failure the visitor's own click produced can move focus into its recovery
  - CONN-04's recovery is worthless behind a second click - but Tab always
  leaves it and Escape closes it. The four close paths (Escape, focus leaving, a
  click outside, and a transition into a state with no disclosure) all call
  `onclose`; the slot owns `open` and is the only thing that toggles it.

  FORGET THIS ZONA RENDERS ONLY WHERE THE BROWSER CAN REVOKE - session.canForget,
  set from the feature test at adoption. A revoke control on a browser that
  cannot revoke has no reason to state and no fix to offer, which is why DEGR-02's
  present-but-disabled rule (for install controls) does not reach it. Both it and
  DISCONNECT ZONA destroy themselves and hand focus back to the slot, which by
  then reads CONNECT ZONA.

  WHAT THE HEADER DOES UNDER A WRITE, AND WHAT IT DOES NOT (07-UI-SPEC, The
  header device slot, and its disclosure; Z-15). The slot never shows an
  install state and its label never reads a busy word, for four reasons. Phase
  6 contracts the S4 label as the identity summary and sizes the slot's two
  14px line boxes on four label strings, so an install label would be a fifth
  string in a box built for four. The install is a property of the CHOSEN
  configuration, which lives in the panel, and the panel is on screen whenever
  a write is possible because every control that writes exists nowhere else.
  Y-11 forbids one block in two mounts, and a busy state in the header and in
  the panel at once is exactly that. And a RAM write settles in two frames: a
  header label that changes for 40 ms is noise, not feedback. What the header
  contributes instead is THE LOCK. DISCONNECT ZONA and FORGET THIS ZONA are
  the two controls that can pull the port out from under a write with the
  visitor's own hand - producing `partial` under a RAM leg and `unconfirmed`
  under a store - so both carry a real `disabled` while session.writeLock is
  true, on every leg and the store leg explicitly, with the reason inline
  beneath the pair (WRITE_LOCK_REASON) bound by aria-describedby. A real
  `disabled` removes them from the tab order; that is the correct behaviour
  and nothing overrides it. The lock is the session's flag, set and cleared by
  the install store around every leg; this component reads it and decides
  nothing. On the real page the drawer is closed whenever the panel is open
  (panelOwnsProse), so the lock is what a visitor meets who un-chose the panel
  with Back or a side pad during a leg and then opened the drawer - which,
  under a store that has not confirmed, is a window of several seconds.

  THE SNAPSHOT LINE (07-CONTEXT D-04 amended, SAFE-04). Beneath Phase 6's
  identity line the S4 block says where the copy of the module's own Setup and
  Timer is kept: the durable form when the module's serial was answered and the
  record is in this browser, the honest session-only form when it was not. It
  is rendered only while the install store holds a snapshot - during
  `snapshotting` there is no line - and it names no control, because the panel
  may be closed when it is read. FORGET THIS ZONA's explanation says the copy
  stays (Z-13): revoking a permission is never a reason to destroy somebody's
  only copy of their own configuration, and nothing in this phase deletes one.

  Every string comes from session-copy; none is retyped here. The three static
  specifiers are the chunk guard's permitted paths (config-shape.spec.ts test
  13): the session, its import-free copy module, and the install store, whose
  own three specifiers are two zero-import modules and the session - all free
  of the protocol package, which is what lets a header component name them on
  the first paint of /.

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
    SAFE_PROMISE,
    SNAPSHOT_DURABLE_LINE,
    SNAPSHOT_SESSION_LINE,
    TWO_STEP,
    UNPLUGGED_WHILE_CONNECTED,
    WRITE_LOCK_REASON,
    identitySentence,
    multiModuleLine,
    slotStateOf,
  } from "$lib/device/session-copy";
  import FailureBlock from "./FailureBlock.svelte";

  let {
    open,
    panelOwnsProse = false,
    onclose,
    opener = null,
  }: {
    /** Whether the drawer is rendered at all. Owned by DeviceSlot, which is the
        only thing that toggles it, so there is no second source of truth for
        "is the drawer open". */
    open: boolean;
    /** True while the chosen panel is rendering the session's prose (Y-11). The
        drawer never opens while it is true, and closes if it is open when it
        becomes true. Same signal DeviceNote takes, threaded from the same
        per-route expression through DeviceSlot. */
    panelOwnsProse?: boolean;
    /** Escape, focus leaving, a click outside, and a transition into S1, S2 or
        S7 - the four close paths all call this. */
    onclose: () => void;
    /** The slot's own element, the place focus goes back to when nothing else
        had it. On the S6 road the click that raised the failure passed
        through S3, where the slot is `disabled` and the browser blurs it, so by
        the time the drawer opens document.activeElement is the body; without
        this, Escape would hand focus to the body and orphan it (plan 06-13,
        observed on the served build). */
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

  /**
   * The snapshot line's form, decided by the install store: the record is in
   * this browser, or it is this tab's alone. Rendered only while a snapshot is
   * in hand (see the markup), so `snapshotting` shows no line.
   */
  const snapshotLine = $derived(
    install.snapshotDurable ? SNAPSHOT_DURABLE_LINE : SNAPSHOT_SESSION_LINE,
  );

  /**
   * The id of the lock's reason line, named by both disabled controls through
   * aria-describedby while the lock is on. Unique per mount, like the slot's
   * describedby twin.
   */
  const uid = $props.id();
  const lockId = `${uid}-write-lock`;

  /** The container, a programmatic focus target only. */
  let container = $state<HTMLDivElement | null>(null);
  /** The element focused just before the drawer opened - the slot - restored on Escape. */
  let previouslyFocused: HTMLElement | null = null;

  /**
   * When the drawer opens, remember what had focus. If the state is S6 the
   * drawer was opened by the arriving failure rather than by a summary the
   * visitor is standing on, so move focus into the recovery; otherwise leave
   * focus where the summary click left it.
   */
  let wasRendered = false;
  $effect(() => {
    if (rendered && !wasRendered) {
      const active =
        typeof document !== "undefined"
          ? (document.activeElement as HTMLElement | null)
          : null;
      // The body is not a place to hand focus back to: it is what a blurred
      // disabled slot leaves behind (see `opener`). Fall back to the slot.
      previouslyFocused =
        active && active !== document.body ? active : (opener ?? active);
      if (slot === "S6") container?.focus();
    }
    wasRendered = rendered;
  });

  /**
   * A click anywhere outside the drawer closes it. Attached on the next frame
   * so the very click that opened the drawer does not immediately close it, and
   * in the capture phase so it runs before anything swallows the event.
   */
  $effect(() => {
    if (!rendered) return;
    let attached = false;
    const onDocPointerDown = (event: MouseEvent) => {
      if (!container) return;
      if (!container.contains(event.target as Node)) onclose();
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

  /**
   * Escape closes and returns focus to the slot. It is handled at the window
   * rather than on the container so the container carries no keydown handler
   * (which would demand an ARIA role, and a disclosure is not a dialog); it
   * acts only while the drawer is rendered.
   */
  function onWindowKeydown(event: KeyboardEvent): void {
    if (!rendered) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      onclose();
      previouslyFocused?.focus();
    }
  }

  function onFocusout(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (container && (next === null || !container.contains(next))) onclose();
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
      <p class="body">{SAFE_PROMISE}</p>
      <!--
        The lock (Z-15): a real `disabled` on both controls while the session's
        writeLock is on - every leg, the store leg explicitly - with the reason
        line beneath the pair as their description. See the header.
      -->
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
  /*
    Non-modal, anchored to the slot: right edges aligned, 8px below the header
    row. The border and the black ground are the whole treatment - no shadow, no
    glow, no backdrop tint (06-UI-SPEC). The parent (.device-chrome, plan 06-11)
    is position: relative, so this hangs from the slot's own corner.
  */
  .device-details {
    position: absolute;
    inset-inline-end: 0;
    inset-block-start: calc(100% + 8px);
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: 16px;
    inline-size: calc(100vw - 48px);
    max-inline-size: 360px;
    padding: 16px;
    border: 1px solid var(--color-line);
    border-radius: 10px;
    background: var(--color-ground);
    text-align: start;
  }

  .device-details:focus-visible {
    outline: 2px solid var(--color-accent);
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

  /*
    DISCONNECT ZONA and FORGET THIS ZONA: wide-tracked uppercase labels on the
    44px interactive floor, quiet until hovered. No fill and no border colour -
    a session-ending action does not shout, and nothing here is destructive to
    the module (SAFE-01). Under the write lock both are a real `disabled` in the
    dim rung, with the reason line beneath them; a disabled control does not
    brighten on hover.
  */
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
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 160ms ease-out;
  }

  .action:hover:not(:disabled),
  .action:focus-visible {
    color: var(--color-ink);
  }

  .action:disabled {
    color: var(--color-ink-dim);
    cursor: not-allowed;
  }

  .revoke {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /*
    "Nothing listed?" and "The chooser never appeared?": real disclosures, each
    a question the visitor opens only if it applies to them (a question mark is
    not the banned exclamation mark). The summary sits on the 44px floor.
  */
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
    outline: 2px solid var(--color-accent);
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
