<!--
  The context bar's destination zone, one component for both routes: Target over
  the pages the module enumerated, Store on ZONA, the lines beneath and a
  failure's block. Props: name (the write's label), config (the five strings,
  undefined while measuring), refusal (the caller's over-budget sentence).
  Nothing here is a second write path: Store's click is install.keepOnDevice -
  one click, nothing opens (BENCH-2026-09-16.txt section 2) - and the select's
  change is install.switchPage - the one call, no review. No Apply since
  2026-09-16 (section 1), no Put back (D-07). The honesty line is Store's
  sr-only description, never a painted block.
  Every sentence is install-copy.ts's or page-target.ts's; square everywhere (D-01).
  Decided at 13.1-06 (13.1-CONTEXT D-06, D-07); see .planning/phases/13.1-bench-corrections-four/13.1-06-SUMMARY.md

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import {
    HONESTY_INCAPABLE,
    HONESTY_SNAPSHOTTING,
    KEEP_LABEL,
    KEEP_REASONS,
    NEEDS_ZONA,
    STILL_WRITING_LINE,
    keepLineEnabled,
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
    TARGET_LABEL,
    pageName,
    switchingLine,
    unverifiedLine,
  } from "$lib/device/page-target";
  import { session } from "$lib/device/session.svelte";
  import FailureBlock from "./FailureBlock.svelte";

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
    /** The caller's over-budget sentence while a string is over 908; Store is disabled on it. */
    refusal?: string | undefined;
  } = $props();

  const uid = $props.id();
  const targetId = `${uid}-target`;
  const lineId = `${uid}-line`;
  const refusalId = `${uid}-refusal`;
  const storeLineId = `${uid}-store-line`;
  const honestyId = `${uid}-honesty`;

  /* The zone's state, as the workspace derived it (13-12). */
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
  /** Store on ZONA's reason (install-copy.ts's KEEP_REASONS); `held` keeps the last non-writing one through a write. */
  const capable = $derived(
    session.phase !== "unsupported" && session.phase !== "insecure",
  );
  const storeReason = $derived(install.keepReason(capable));
  let held = $state<KeepReason | undefined>(undefined);
  $effect(() => {
    if (install.phase !== "writing") held = storeReason;
  });
  const shownReason = $derived(writing ? held : storeReason);
  /**
   * Store is disabled when the store is not armed (no session, a leg or the
   * snapshot in flight, the page target not at rest, the pair withdrawn or
   * over 908), when the closed record names a reason, or on the caller's
   * refusal - a real disabled, never aria-disabled alone (TUNE-05).
   */
  const storeDisabled = $derived(
    !install.armed ||
      storeReason !== undefined ||
      refusal !== undefined ||
      config === undefined ||
      writing,
  );

  /** The page every line names, as the module reports it: the snapshot's page, else identify's; 0 before a ZONA has identified itself. */
  const page = $derived(install.snapshotPage ?? reportedPage ?? 0);

  /**
   * Store's description, in precedence: a browser that cannot write, the snapshot
   * in flight, the ready form with a session (the whole click: the default first,
   * then this written and stored), the no-session sentence. The refusal and the
   * reason line are named separately in aria-describedby.
   */
  const honesty = $derived(
    !capable
      ? HONESTY_INCAPABLE
      : install.phase === "snapshotting"
        ? HONESTY_SNAPSHOTTING
        : session.phase === "connected"
          ? keepLineEnabled(page)
          : NEEDS_ZONA,
  );
  const storeDescribedBy = $derived(
    refusal === undefined
      ? `${honestyId} ${storeLineId}`
      : `${honestyId} ${storeLineId} ${refusalId}`,
  );

  /** The failure block through a write: `heldPhase` is the last phase that was not `writing`, so a step cannot vanish under a hand reaching for it. The effect writes it and never reads `shown`. */
  let heldPhase = $state<InstallPhase>("idle");
  $effect(() => {
    if (install.phase !== "writing") heldPhase = install.phase;
  });
  const shown: InstallPhase = $derived(writing ? heldPhase : install.phase);
  /** The store's name from the click, else the caller's. */
  const shownName = $derived(install.name ?? name);
  /**
   * The seven failure-shaped phases, one builder each (device-ui.spec.ts reads that the
   * four uncertain outcomes keep four bodies); the six success phases return nothing -
   * their captions are the bar's device clause. The two restore phases are the
   * /dev/install/ probe's since 13.1-06. A Store's leg takes the store form of the
   * nothing-landed block; the header's Clear keeps the form it had.
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
          install.action === "keep" ? "store" : "put-back",
          page,
        );
      case "restored-unconfirmed":
        return restoredUnconfirmedBlock(page);
      case "lost":
        return lostBlock(install.leg === "store", KEEP_LABEL, page);
      case "snapshot-failed":
        return snapshotFailedBlock(page);
      default:
        return undefined;
    }
  });

  let targetSelect = $state<HTMLSelectElement | null>(null);
  let storeButton = $state<HTMLButtonElement | null>(null);
  let root = $state<HTMLDivElement | null>(null);

  /** The select changed: the switch, in one call (13.1 D-05). A change that did not leave the wire snaps the select back. */
  async function onTargetChange(event: Event): Promise<void> {
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    if (!Number.isInteger(value)) return;
    if (!(await install.switchPage(value)) && targetSelect) {
      targetSelect.value = String(targetValue ?? "");
    }
  }

  /**
   * Store on ZONA: the one click is the whole write (the defaults, the
   * configuration, the store, the proof). A commit must not drop focus on
   * the body (13.1-07's rule, re-aimed at the one click): the store publishes
   * `writing` before its first await, so Store disables in this flush and
   * the zone itself (tabindex="-1") takes the focus the button held - done
   * here, synchronously, because the browser has already moved focus by the
   * time an effect could read it.
   */
  function store(): void {
    if (storeDisabled) return;
    const held = document.activeElement === storeButton;
    void install.keepOnDevice(config, name);
    if (held && install.phase === "writing") root?.focus();
  }
</script>

<div
  bind:this={root}
  class="destination"
  data-testid="destination"
  data-status={install.pageStatus}
  tabindex="-1"
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
    <span class="sr-only" id={honestyId} data-testid="store-honesty"
      >{honesty}</span
    >
    <button
      bind:this={storeButton}
      class="destination-store"
      type="button"
      data-testid="store-on-zona"
      disabled={storeDisabled}
      aria-describedby={storeDescribedBy}
      onclick={store}
    >
      {KEEP_LABEL}
    </button>
  </div>
  <!-- Store on ZONA's reason, the closed record's three; hidden when the record names none. -->
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
      data-testid="store-refusal"
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
  /* The zone as the workspace drew it (13-12), less Apply since 2026-09-16: label, select, Store on ZONA (bordered, never filled) on one row; the lines; a failure's block last. No corner (D-01). */
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

  /* Store on ZONA: bordered, never filled (Phase 4's rule for the flash write; the filled Apply left at 2026-09-16 and nothing took its fill). */
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

  /* The lines beneath: the bar's quiet 13px; the unverified one at full ink; never the alarm red (Z-01: the red means one thing on this panel). */
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

  /* A failure's detail and steps: read left to right under the right-aligned row. */
  .failure {
    max-inline-size: 420px;
    text-align: start;
  }
</style>
