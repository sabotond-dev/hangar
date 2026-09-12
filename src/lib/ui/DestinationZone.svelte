<!--
  THE CONTEXT BAR'S DESTINATION ZONE, ONE COMPONENT FOR BOTH ROUTES (plan
  13.1-06; 13.1-CONTEXT D-06 and D-07, bench line 6; Bible section 9 and
  section 10; PDF pages 3 and 5; 13-CONTEXT D-03, D-06 clause 1, D-14 Q7;
  SAFE-01, SAFE-02, SAFE-03, SAFE-05, SAFE-07, SAFE-08, SAFE-09, TUNE-05).

  WHAT THIS IS. The right side of the bar's second row - `Target` over the
  pages the module enumerated, `Apply to ZONA`, `Store on ZONA` - exactly as
  the user drew it at the fourth bench: "the second row in the page (so under
  the logo) the right side should look like this: Target PAGE 1 on ZONA
  selector, Apply to ZONA button, Store on ZONA button." The workspace
  (/playground/[id]/) and the Sandbox (/sandbox/[draftId]/) mount THIS FILE
  and nothing else in its place: until 13.1-06 the workspace drew its own
  Target and Apply in its destination snippet AND kept Phase 7's install
  column under the surface (a second Apply, the honesty block, NEXT, Put
  back, Store on ZONA, the reset, Disconnect), while the Sandbox rendered
  13-17's SurfaceActions.svelte destination half. Two copies of the one
  control that moves hardware is how they drift (13.1-CONTEXT D-11 a), so
  SurfaceActions' destination half moved here whole - its derivations, its
  handlers, its markup and its style - and SurfaceActions is the share
  control alone. The column is gone from the workspace (batch row J.13,
  owed since the gate); TryOnDevice.svelte, InstallState.svelte,
  KeepOnDevice.svelte and PutBack.svelte lost their last consumer and were
  deleted by name (D-12's precedent: nothing is left mounted nowhere).

  NOTHING HERE IS A SECOND WRITE PATH (13-17's paragraph, kept). Apply is
  `install.tryOnDevice(config, name)` - the same call TRY ON DEVICE made, the
  same fifteen phases, the same snapshot before the first write, the same
  acknowledgements, the same ACK gate (SAFE-07's settled-from-
  acknowledgements rule, unmoved); a catalog entry's pair and a surface's
  landing reach the store in one shape and the store cannot tell them apart.
  Store on ZONA is `install.openConfirm()` - it writes nothing, and
  KeepConfirm.svelte renders IN THIS CONTROL'S PLACE (the control and the
  confirmation are never on the screen together, WCAG 2.5.3), so the site
  still has one confirmation and it is still that one. The page target is
  the store's (13-12; 13.1-CONTEXT D-05): THE SELECT'S CHANGE IS THE SWITCH -
  install.switchPage(value), the target's request() then its confirm(), the
  restore heartbeat then exactly one switch, no review, by the user's word.
  Opening the menu sends nothing; a change that did not leave the wire
  resolves false and the select snaps back. On a focused, closed select
  Chromium fires change on every ArrowUp / ArrowDown, so each arrow press is
  a switch until the select disables at switching - the visitor's gesture.
  Apply is enabled on the store's one condition (applyReady - the module's
  own report of the page) and the caller's refusal.

  PUT BACK IS GONE BY THE USER'S WORD (D-07: "we dont even need the Put back
  function that totally unnecessary if we have a clear button", and the
  answer "remove" to the orchestrator's question). It is on neither route's
  zone and it was never under Device actions. The consequence, plainly:
  after an Apply the way back to the module's own page is Grid Editor or the
  header's Clear to the firmware default. WHAT STAYS is the machinery:
  snapshot.ts, the fetch at connect before any write, the per-page record and
  its persistence (SAFE-03, SAFE-04), the re-snapshot on a page change, and
  the store's putBack() with its `restoring` / `restored` phases - reachable
  from the /dev/install/ probe's own button only, and pinned there and in
  install.spec.ts so the restore path cannot rot. A snapshot is a safety
  feature, not a control.

  THE HONESTY LINE IS APPLY'S DESCRIPTION, NOT A BLOCK. TryOnDevice rendered
  five sizing twins under the primary and showed one; here the same
  derivation - HONESTY_INCAPABLE on the two capability phases,
  HONESTY_NO_SESSION with no session, HONESTY_SNAPSHOTTING while the
  snapshot is read, honestyReady(page) once the module has identified itself
  - is an sr-only span that Apply's aria-describedby points at, with the
  over-budget refusal's id appended while one is set. Nothing is painted; a
  screen reader arriving on Apply hears what the click does and, over
  budget, why it cannot.

  THE FIFTEEN PHASES STILL RENDER, IN TWO PLACES. The bar's status zone
  carries every success caption through device-clause.ts (`ZONA connected`,
  `Applied to Page 2. Store on ZONA to keep it after power-off.`, `Stored on
  ZONA · Page 2`, the reset's, the restore's), so the six success bodies
  InstallState.svelte drew under the surface retired with it (their facts
  survive in the captions and in confirmReplaces). The seven failure-shaped
  phases - unconfirmed, kept-mismatch, partial, nothing-landed,
  restored-unconfirmed, lost, snapshot-failed - keep their detail and their
  steps: `failure` below is InstallState's phase-to-builder mapping ported
  verbatim, one case per phase so device-ui.spec.ts's anti-collapse test can
  read that the four uncertain outcomes keep four bodies, rendered through
  FailureBlock beneath the lines under `install-failure` (section 10:
  preserve access to errors). Through a write the block holds the last
  non-writing phase (`held`), as InstallState held it, so a step cannot
  vanish under a hand reaching for it. STILL_WRITING_LINE - the one honest
  line of `writing` past 2000 ms (Z-09; SAFE-08's visible half) - renders
  beneath the row while the store's `slow` flag is set; the live region
  speaks LIVE_STILL_WRITING once from the store.

  OVER BUDGET REFUSES BEFORE THE CLICK (TUNE-05). `refusal` is the caller's
  sentence when a string is over 908 (the workspace's tuner, the Sandbox's
  meter); while it is set Apply is a real `disabled` button described by
  that sentence, the sentence is on the screen in the validation ink, and
  the install store is never asked. The store refuses a Setup or a Timer at
  the limit on its own as well, and install.spec.ts asserts a surface over
  budget puts ZERO frames on the wire.

  THE WORDS. `Apply to ZONA`, `Store on ZONA` and `Target` are section 9's
  and page 3's, verbatim (page-target.ts and install-copy.ts); the disabled
  reasons for Store on ZONA are install-copy.ts's KEEP_REASONS; the honesty
  strings, the failure blocks and the still-writing line are install-copy's.
  This file authors no sentence. Square everywhere (D-01): every
  border-radius here is 0.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { tick } from "svelte";
  import {
    HONESTY_INCAPABLE,
    HONESTY_NO_SESSION,
    HONESTY_SNAPSHOTTING,
    KEEP_LABEL,
    KEEP_REASONS,
    STILL_WRITING_LINE,
    honestyReady,
    keptMismatchBlock,
    lostBlock,
    nothingLandedBlock,
    partialBlock,
    restoredUnconfirmedBlock,
    snapshotFailedBlock,
    unconfirmedBlock,
    type InstallBlock,
    type KeepReason,
  } from "$lib/device/install-copy";
  import { install, type InstallPhase } from "$lib/device/install.svelte";
  import {
    APPLY_LABEL,
    TARGET_LABEL,
    pageName,
    switchingLine,
    unverifiedLine,
  } from "$lib/device/page-target";
  import { session } from "$lib/device/session.svelte";
  import FailureBlock from "./FailureBlock.svelte";
  import KeepConfirm from "./KeepConfirm.svelte";

  let {
    name,
    config,
    refusal,
  }: {
    /** The configuration's name: the store's label for the write (the entry's or the surface's). */
    name: string;
    /** The five strings to write, or undefined while the caller is measuring. */
    config?:
      | {
          systemTimer: string;
          system: string;
          systemUtility: string;
          setup: string;
          timer: string;
        }
      | undefined;
    /** The caller's over-budget sentence while a string is over 908; Apply is disabled on it. */
    refusal?: string | undefined;
  } = $props();

  const uid = $props.id();
  const targetId = `${uid}-target`;
  const lineId = `${uid}-line`;
  const refusalId = `${uid}-refusal`;
  const storeLineId = `${uid}-store-line`;
  const honestyId = `${uid}-honesty`;

  /* THE DESTINATION ZONE'S STATE, as the workspace derived it (13-12). */
  const reportedPage = $derived(session.identity?.activePage);
  const targetPages = $derived(
    install.pages.length > 0
      ? install.pages
      : reportedPage === undefined
        ? []
        : [reportedPage],
  );
  const targetValue = $derived(install.pageRequested ?? reportedPage);
  const targetPending = $derived(install.pageStatus !== "reported");
  const writing = $derived(install.phase === "writing");
  const applyDisabled = $derived(
    !install.applyReady ||
      refusal !== undefined ||
      config === undefined ||
      writing ||
      install.phase === "snapshotting",
  );
  /** Store on ZONA: KEEP ON DEVICE's seven-row table, held through a write as KeepOnDevice.svelte held it. */
  const capable = $derived(
    session.phase !== "unsupported" && session.phase !== "insecure",
  );
  const storeReason = $derived(install.keepReason(capable));
  let held = $state<KeepReason | undefined>(undefined);
  $effect(() => {
    if (install.phase !== "writing") held = storeReason;
  });
  const shownReason = $derived(writing ? held : storeReason);
  const storeDisabled = $derived(storeReason !== undefined || writing);

  /**
   * The page every line and block names, as the module reports it (the copy
   * adds one, D-23): the snapshot's page once one is in hand, else the page
   * the module reported at identify. The 0 exists so the builders take a
   * number before a ZONA has identified itself; no visitor reads it.
   */
  const page = $derived(install.snapshotPage ?? reportedPage ?? 0);

  /**
   * APPLY'S DESCRIPTION: TryOnDevice's precedence (07-UI-SPEC I9), ported.
   * A browser that cannot write outranks everything (Z-06); then the
   * snapshot in flight; then the ready form once a session is open; the
   * pre-connect form otherwise. The refusal is the caller's and is named
   * separately in aria-describedby, so it is not folded in here.
   */
  const honesty = $derived(
    !capable
      ? HONESTY_INCAPABLE
      : install.phase === "snapshotting"
        ? HONESTY_SNAPSHOTTING
        : session.phase === "connected"
          ? honestyReady(page)
          : HONESTY_NO_SESSION,
  );
  const applyDescribedBy = $derived(
    refusal === undefined ? honestyId : `${honestyId} ${refusalId}`,
  );

  /**
   * THE FAILURE BLOCK, held through a write. `heldPhase` is the last phase
   * that was not `writing` (InstallState's rule, kept: a block must not
   * vanish under a hand reaching for its step); `shown` is that phase during
   * a write and the store's phase otherwise. Written from an effect on the
   * phase and read by `shown`; the effect never reads it, so there is no
   * loop.
   */
  let heldPhase = $state<InstallPhase>("idle");
  $effect(() => {
    if (install.phase !== "writing") heldPhase = install.phase;
  });
  const shown: InstallPhase = $derived(writing ? heldPhase : install.phase);
  /** The store's name from the click, else the caller's. */
  const shownName = $derived(install.name ?? name);
  /**
   * The seven failure-shaped phases, each through its own builder - the
   * mapping InstallState.svelte carried, ported verbatim with the surface's
   * label now APPLY_LABEL. The six success phases return nothing: their
   * captions are the bar's device clause. `nothing-landed` after a restore
   * and `restored-unconfirmed` are the probe's since 13.1-06 (the store's
   * putBack() has no control on either route); their words stay the
   * machinery's own so the probe reads the truth.
   */
  const failure = $derived.by((): InstallBlock | undefined => {
    switch (shown) {
      case "unconfirmed":
        return unconfirmedBlock(shownName, page);
      case "kept-mismatch":
        return keptMismatchBlock(page);
      case "partial":
        return partialBlock(
          install.landed ??
            "The system timer, the page init, the utility script and the Timer",
          install.failed ?? "the Setup",
          page,
        );
      case "nothing-landed":
        return nothingLandedBlock(
          install.action === "try" ? "try" : "put-back",
          page,
        );
      case "restored-unconfirmed":
        return restoredUnconfirmedBlock(page);
      case "lost":
        return lostBlock(install.leg === "store", APPLY_LABEL, page);
      case "snapshot-failed":
        return snapshotFailedBlock(page);
      default:
        return undefined;
    }
  });

  let targetSelect = $state<HTMLSelectElement | null>(null);
  let storeButton = $state<HTMLButtonElement | null>(null);

  /** The select changed: the switch, in one call (13.1 D-05). A change that did not leave the wire snaps the select back. */
  async function onTargetChange(event: Event): Promise<void> {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    if (!Number.isInteger(value)) return;
    if (!(await install.switchPage(value)) && targetSelect) {
      targetSelect.value = String(targetValue ?? "");
    }
  }

  /** Apply to ZONA: the one RAM write, with the caller's name as its label. */
  function apply(): void {
    if (applyDisabled) return;
    void install.tryOnDevice(config, name);
  }

  /** Store on ZONA: opens the site's one confirmation and writes nothing. */
  function store(): void {
    install.openConfirm();
  }

  /** The confirmation closed without a store: focus returns to the control it replaced (KeepConfirm's one focus rule). */
  function closeConfirm(): void {
    install.dismissConfirm();
    void tick().then(() => storeButton?.focus());
  }
</script>

<div
  class="destination"
  data-testid="destination"
  data-status={install.pageStatus}
>
  <div class="destination-row">
    <label class="destination-label" for={targetId}>{TARGET_LABEL}</label>
    <select
      bind:this={targetSelect}
      id={targetId}
      class="destination-select"
      data-testid="destination-page"
      value={String(targetValue ?? "")}
      disabled={install.pageStatus === "switching" || writing}
      aria-describedby={targetPending ? lineId : undefined}
      onchange={(event) => void onTargetChange(event)}
    >
      {#each targetPages as page (page)}
        <option value={String(page)} data-reported={page === reportedPage}>
          {pageName(page)}{page === reportedPage ? " · on ZONA" : ""}
        </option>
      {/each}
    </select>
    <button
      class="destination-apply"
      type="button"
      data-testid="apply-to-zona"
      disabled={applyDisabled}
      aria-describedby={applyDescribedBy}
      onclick={apply}
    >
      {APPLY_LABEL}
    </button>
    <span class="sr-only" id={honestyId} data-testid="apply-honesty"
      >{honesty}</span
    >
    {#if install.confirmOpen}
      <div class="confirm" data-testid="store-confirm">
        <KeepConfirm onclose={closeConfirm} />
      </div>
    {:else}
      <button
        bind:this={storeButton}
        class="destination-store"
        type="button"
        data-testid="store-on-zona"
        disabled={storeDisabled}
        aria-describedby={storeLineId}
        onclick={store}
      >
        {KEEP_LABEL}
      </button>
    {/if}
  </div>
  <!-- Store on ZONA's reason, KEEP ON DEVICE's own seven; hidden when the control is live. -->
  <p
    class="destination-line"
    id={storeLineId}
    data-testid="store-on-zona-line"
    hidden={shownReason === undefined}
  >
    {shownReason === undefined ? "" : KEEP_REASONS[shownReason]}
  </p>
  {#if refusal !== undefined}
    <p
      class="destination-line refusal"
      id={refusalId}
      data-testid="apply-refusal"
    >
      {refusal}
    </p>
  {/if}
  {#if install.pageStatus === "switching" && install.pageRequested !== undefined}
    <p class="destination-line" id={lineId} data-testid="destination-line">
      {switchingLine(install.pageRequested)}
    </p>
  {:else if install.pageStatus === "unverified" && install.pageRequested !== undefined}
    <p
      class="destination-line unverified"
      id={lineId}
      data-testid="destination-line"
    >
      {unverifiedLine(install.pageRequested, install.pageReported)}
    </p>
  {/if}
  {#if install.slow}
    <p class="destination-line" data-testid="still-writing">
      {STILL_WRITING_LINE}
    </p>
  {/if}
  {#if failure !== undefined}
    <div class="failure" aria-busy={writing ? "true" : undefined}>
      <FailureBlock block={failure} testid="install-failure" />
    </div>
  {/if}
</div>

<style>
  /* THE DESTINATION ZONE, as the workspace drew it (13-12): the Target
     label, the select, the filled Apply, then Store on ZONA (bordered, never
     filled - the fill is Apply's) on one row; the lines beneath; a failure's
     block last. No corner anywhere (D-01). */
  .destination {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    padding-block: 8px;
  }

  .destination-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .destination-label {
    align-self: center;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  .destination-select {
    appearance: auto;
    min-block-size: 44px;
    min-inline-size: 104px;
    padding-inline: 8px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: var(--color-workspace);
    font-family: var(--font-sans);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: var(--color-ink);
    cursor: pointer;
  }

  .destination-select:disabled {
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }

  .destination-apply {
    appearance: none;
    min-block-size: 44px;
    min-inline-size: 194px;
    padding-inline: 24px;
    border: 1px solid var(--color-action);
    border-radius: 0;
    background: var(--color-action);
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-workspace);
    cursor: pointer;
  }

  .destination-apply:disabled {
    border-color: var(--color-boundary);
    background: transparent;
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }

  /* Store on ZONA: bordered, never filled, never the same size or fill as
     Apply (Phase 4's rule for the two install controls). */
  .destination-store {
    appearance: none;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.2;
    color: var(--color-ink);
    cursor: pointer;
  }

  .destination-store:hover:not(:disabled) {
    border-color: var(--color-action);
  }

  .destination-store:disabled {
    color: var(--color-ink-quiet);
    cursor: not-allowed;
  }

  .confirm {
    min-inline-size: 0;
  }

  /* The switching line, the unverified line, the store's reason, the
     refusal and the still-writing line: the bar's quiet 13px, the unverified
     one at full ink because it is a state the visitor must read, never the
     alarm red (KeepConfirm.svelte says why the red means one thing). */
  .destination-line {
    margin: 0;
    max-inline-size: 420px;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    text-align: end;
    color: var(--color-ink-quiet);
  }

  .destination-line[hidden] {
    display: none;
  }

  .destination-line.unverified {
    color: var(--color-ink);
  }

  /* The over-budget reason: section 12's validation ink, never the alarm red. */
  .destination-line.refusal {
    color: var(--color-error-ink);
  }

  /* A failure's detail and steps: FailureBlock's own type, read left to
     right under the right-aligned row, no wider than the lines. */
  .failure {
    max-inline-size: 420px;
    text-align: start;
  }
</style>
