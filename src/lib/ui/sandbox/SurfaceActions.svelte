<!--
  THE SURFACE'S ACTIONS (plan 13-17; Bible section 9 and section 11; PDF page
  3's context bar; 13-CONTEXT D-03, D-06, D-14 Q7, D-18, D-19; BUILD-03,
  BUILD-05, SAFE-01, SAFE-02, SAFE-03, SAFE-07, SAFE-09, KEEP-04, SHARE-01).

  TWO ZONES, ONE FILE. `zone="destination"` is the context bar's destination
  zone for the Sandbox - 13-12's Target select, `Apply to ZONA`, and beneath
  the row the switching line or the unverified line, exactly as
  /playground/[id]/ renders them - with section 9's `Store on ZONA` and the
  existing PUT BACK beside Apply, because a surface installed to RAM needs
  its store and its way back where the visitor is standing. `zone="share"`
  is the share control: a surface exports as a FILE (D-14 Q7 - a surface has
  no catalog entry for a link to point at, and a fixed sixteen-region
  envelope would be some 420 characters of hash), through 13-13's
  transfer.ts and nothing else, with the one-clause explanation beside it.

  NOTHING HERE IS A SECOND WRITE PATH. Apply is `install.tryOnDevice(config,
  name)` - the same call as TRY ON DEVICE and the Playground's Apply, the
  same fifteen phases, the same snapshot, the same acknowledgements; the
  config is land.ts's landing in the tuner's own shape, and the store cannot
  tell it from an entry's. Store on ZONA is `install.openConfirm()` - the
  same click as KEEP ON DEVICE, and KeepConfirm.svelte renders IN THIS
  CONTROL'S PLACE (KeepOnDevice.svelte's rule: the control and the
  confirmation are never on the screen together), so the site still has one
  confirmation and it is still that one. PUT BACK is PutBack.svelte, mounted
  whole. The page target is the store's (13-12; 13.1-CONTEXT D-05): THE
  SELECT'S CHANGE IS THE SWITCH - install.switchPage(value), the target's
  request() then its confirm(), the restore heartbeat then exactly one
  switch, and no destination review, by the user's word at the fourth bench
  ("When you change page form the drop down just change the page and thats
  it."). Opening the menu sends nothing; a change that did not leave the
  wire resolves false and the select snaps back. On a focused, closed select
  Chromium fires change on every ArrowUp / ArrowDown, so each arrow press is
  a switch until the select disables at switching - the visitor's gesture.
  Apply is enabled on the store's one condition (applyReady - the module's
  own report of the page, the ACK gate unmoved) and the landing's refusal.

  OVER BUDGET REFUSES BEFORE THE CLICK (TUNE-05, on a producer it had never
  seen). `refusal` is the meter's sentence when a string is over 908; while
  it is set Apply is a real `disabled` button described by that sentence, so
  the click cannot happen and the install store is never asked. The store
  refuses a Setup or a Timer at the limit on its own as well, and
  install.spec.ts asserts a surface over budget puts ZERO frames on the
  wire. The meter turns red on the same fact (the route's meter line).

  THE WORDS. `Apply to ZONA`, `Store on ZONA` and `Target` are section 9's
  and page 3's, verbatim (page-target.ts and copy.ts); the disabled reasons
  for Store on ZONA are install-copy.ts's KEEP_REASONS, unchanged; the export
  label, the no-link explanation and the exported line are HANGAR's, in
  copy.ts, ledgered under "From 13-17". Square everywhere (D-01).

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { tick } from "svelte";
  import { KEEP_REASONS, type KeepReason } from "$lib/device/install-copy";
  import { install } from "$lib/device/install.svelte";
  import {
    APPLY_LABEL,
    TARGET_LABEL,
    pageName,
    switchingLine,
    unverifiedLine,
  } from "$lib/device/page-target";
  import { session } from "$lib/device/session.svelte";
  import {
    EXPORT_SURFACE,
    NO_LINK_EXPLANATION,
    STORE_LABEL,
  } from "$lib/sandbox/copy";
  import KeepConfirm from "$lib/ui/KeepConfirm.svelte";
  import PutBack from "$lib/ui/PutBack.svelte";

  let {
    zone,
    name,
    config,
    refusal,
    exported,
    onexport,
  }: {
    zone: "destination" | "share";
    /** The surface's name: the store's label for the write. */
    name: string;
    /** The landing's five strings, or undefined while the meter is measuring. */
    config?:
      | {
          systemTimer: string;
          system: string;
          systemUtility: string;
          setup: string;
          timer: string;
        }
      | undefined;
    /** The meter's over sentence while a string is over 908; Apply is disabled on it. */
    refusal?: string | undefined;
    /** The export's success line, while it is shown. */
    exported?: string | undefined;
    onexport?: () => void;
  } = $props();

  const uid = $props.id();
  const targetId = `${uid}-target`;
  const lineId = `${uid}-line`;
  const refusalId = `${uid}-refusal`;
  const storeLineId = `${uid}-store-line`;
  const explanationId = `${uid}-explanation`;

  /* THE DESTINATION ZONE'S STATE, as the workspace derives it (13-12). */
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
  /** Store on ZONA: KEEP ON DEVICE's seven-row table, held through a write as KeepOnDevice.svelte holds it. */
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

  /** Apply to ZONA: the same write as TRY ON DEVICE, with the surface's name as its label. */
  function apply(): void {
    if (applyDisabled) return;
    void install.tryOnDevice(config, name);
  }

  /** Store on ZONA: the same click as KEEP ON DEVICE - it opens the site's one confirmation and writes nothing. */
  function store(): void {
    install.openConfirm();
  }

  /** The confirmation closed without a store: focus returns to the control it replaced. */
  function closeConfirm(): void {
    install.dismissConfirm();
    void tick().then(() => storeButton?.focus());
  }
</script>

{#if zone === "destination"}
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
        aria-describedby={refusal !== undefined ? refusalId : undefined}
        onclick={apply}
      >
        {APPLY_LABEL}
      </button>
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
          {STORE_LABEL}
        </button>
      {/if}
      <div class="put-back">
        <PutBack />
      </div>
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
  </div>
{:else}
  <div class="share" data-testid="surface-share">
    {#if exported !== undefined}
      <span
        class="exported type-helper"
        role="status"
        data-testid="export-outcome">{exported}</span
      >
    {/if}
    <button
      class="outlined"
      type="button"
      data-testid="export-surface"
      aria-describedby={explanationId}
      onclick={() => onexport?.()}
    >
      {EXPORT_SURFACE}
    </button>
    <p
      class="explanation type-helper"
      id={explanationId}
      data-testid="no-link-explanation"
    >
      {NO_LINK_EXPLANATION}
    </p>
  </div>
{/if}

<style>
  /* THE DESTINATION ZONE, as the workspace draws it (13-12): the Target
     label, the select, the filled Apply, then Store on ZONA (bordered, never
     filled - the fill is Apply's) and PUT BACK on one row; the lines beneath.
     No corner anywhere (D-01). */
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

  .confirm,
  .put-back {
    min-inline-size: 0;
  }

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

  /* The share: the outlined control beside Save copy, the explanation beneath. */
  .share {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }

  .exported {
    color: var(--color-ink-quiet);
  }

  .outlined {
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 16px;
    border: 1px solid var(--color-boundary);
    border-radius: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 14px;
    color: var(--color-ink);
    cursor: pointer;
  }

  .outlined:hover {
    border-color: var(--color-action);
  }

  .explanation {
    margin: 0;
    max-inline-size: 420px;
    text-align: end;
    color: var(--color-ink-quiet);
  }
</style>
