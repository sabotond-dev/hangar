<!--
  THE DESTINATION REVIEW (Phase 13, plan 13-12; Bible section 9 "Destination
  review", section 16 "Target review"; 13-CONTEXT D-06, second clause).

  Shown on FIRST USE AND ON EVERY DESTINATION CHANGE - which is to say
  whenever the install store's page target is in its `requested` state: the
  visitor chose a page in the context bar's Target select and nothing has
  been sent. It names BOTH pages, the one being written and the one being
  left, in D-06's own sentence, verbatim: "Switch your ZONA to Page 3? It
  will stop playing Page 1." Its title is section 16's "Target review" row,
  verbatim, with the requested page. Beneath them the device identity and
  the configuration name, because section 9 asks for "device identity, page,
  configuration name, and what will be replaced" - and what will be replaced
  is the sentence's second half.

  IT CANNOT BE SKIPPED, AND THAT IS A DECISION RECORDED HERE RATHER THAN A
  GAP. Section 9 says "Experienced users may skip repetitive review for the
  same destination only when safe and clearly configured." Nothing in v1
  configures it: there is no setting, no "don't ask again", no memory of a
  destination reviewed once. The clause's own condition ("only when ...
  clearly configured") is therefore unmet, and the review is the ONE gate
  between a click on a web page and a ZONA changing what it is playing.
  device-ui.spec.ts asserts the absence of a skip by name. If the user wants
  the clause, it is a question in 13-COPY-NEW.md, not a line here.

  THE AFFIRMATIVE IS THE FIFTH WRITE CLICK. `Switch page` is install-copy's
  SWITCH_PAGE_LABEL and the fifth entry of WRITE_CLICKS: the restore heartbeat
  and the switch leave the wire from install.confirmPage() and from nothing
  else. `Keep this page` (KEEP_PAGE_LABEL), Escape while focus is inside, and
  a session drop all land in install.cancelPage(), which sends nothing.

  FOCUS: MOVED IN, RETURNED, NEVER TRAPPED - and here is what the plan
  assumed and what the tree has. 13-12-PLAN.md says the review "traps focus
  and returns it (13-11's shared helper)". There is no such helper:
  13-11-SUMMARY.md records that KeepConfirm.svelte does NOT trap focus, that
  its header forbids a dialog role, aria-modal, an inert background and a
  focus trap, and that device-ui.spec.ts test 8 asserts it is an inline group
  and never modal. This review follows the one focus contract the tree does
  have for a confirmation: it is a role="group" with tabindex="-1", focus
  moves INTO it on mount (the container, so a screen reader hears the title
  and the sentence before either button), and on close the ROUTE returns
  focus to the Target select the way the workspace returns focus to KEEP ON
  DEVICE when KeepConfirm closes. A trap was not built, because a trap on a
  confirmation this site has ruled never-modal would be the one place the
  site behaves like a dialog, and the reason for the rule - a state that
  arrives must not take the page - is stronger, not weaker, for a control
  that moves hardware. Recorded in the SUMMARY as the finding it is.

  NOT MODAL, NOT FLOATING. It renders in the destination zone, under the
  select row, and the bar grows to hold it; no position: absolute, no
  backdrop, no shadow, no corner (D-01). Every string comes from
  install-copy.ts or page-target.ts; none is retyped here.

  Copyright (C) 2026 Botond Sandor. Licensed under the GNU GPL v3 or later.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import { install } from "$lib/device/install.svelte";
  import { KEEP_PAGE_LABEL, SWITCH_PAGE_LABEL } from "$lib/device/install-copy";
  import {
    pageName,
    replaceReviewTitle,
    switchReviewLine,
  } from "$lib/device/page-target";
  import { session } from "$lib/device/session.svelte";

  let {
    name,
    onclose,
  }: {
    /** The configuration that will be applied after the switch - section 9's "configuration name". */
    name: string | undefined;
    /** The negative, Escape, and the route's own exits land here; the route returns focus. */
    onclose: () => void;
  } = $props();

  const uid = $props.id();
  const titleId = `${uid}-title`;
  const lineId = `${uid}-line`;
  const detailId = `${uid}-detail`;

  /** The two pages the review names. Both are the store's; neither is computed here. */
  const to = $derived(install.pageRequested);
  const from = $derived(install.pageReported);

  /** Section 9's identity: the ZONA's firmware, from the session, and the configuration's name. */
  const fw = $derived(session.identity?.zona.firmware);
  const detail = $derived(
    [
      fw ? `ZONA · fw ${fw.major}.${fw.minor}.${fw.patch}` : "ZONA",
      name
        ? `${name} will be applied to ${to === undefined ? "the page" : pageName(to)}`
        : undefined,
    ]
      .filter((part) => part !== undefined)
      .join(" · "),
  );

  /** The programmatic focus target. */
  let container = $state<HTMLDivElement | null>(null);

  onMount(() => {
    container?.focus();
  });

  /** Escape INSIDE the review dismisses it, as KeepConfirm's does. */
  function onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    if (!container || !container.contains(event.target as Node)) return;
    event.stopPropagation();
    onclose();
  }

  function confirm(): void {
    void install.confirmPage();
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if to !== undefined && from !== undefined}
  <div
    bind:this={container}
    class="review"
    role="group"
    tabindex="-1"
    aria-labelledby={titleId}
    aria-describedby="{lineId} {detailId}"
    data-testid="destination-review"
    data-to={to}
    data-from={from}
  >
    <p class="title" id={titleId}>{replaceReviewTitle(to)}</p>
    <p class="line" id={lineId} data-testid="destination-review-line">
      {switchReviewLine(to, from)}
    </p>
    <p class="detail" id={detailId}>{detail}</p>
    <div class="actions">
      <button
        class="affirmative pill"
        type="button"
        data-testid="destination-review-yes"
        onclick={confirm}
      >
        {SWITCH_PAGE_LABEL}
      </button>
      <button
        class="negative"
        type="button"
        data-testid="destination-review-no"
        onclick={onclose}
      >
        {KEEP_PAGE_LABEL}
      </button>
    </div>
  </div>
{/if}

<style>
  /*
    The block: a hairline, the workspace ground, 16px inside, 8px between
    its children. No shadow, no backdrop, no fill, no corner (D-01). The
    fade is opacity alone and never height, instant under reduced motion.
  */
  .review {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    inline-size: 100%;
    max-inline-size: 420px;
    padding: 16px;
    border: 1px solid var(--color-boundary);
    background: var(--color-workspace);
    animation: fade-in 160ms linear;
  }

  .review:focus-visible {
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

  /* Section 16's row, at full ink. Not a heading. */
  .title {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--color-ink);
  }

  /* D-06's sentence: the fact, plainly. */
  .line {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-ink);
  }

  .detail {
    margin: 0;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-ink-quiet);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-block-start: 4px;
  }

  /*
    The affirmative: bordered, never filled - the fill is Apply to ZONA's and
    this is not it. The 44px floor on both axes is this control's.
  */
  .affirmative {
    appearance: none;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-ink);
    cursor: pointer;
    transition:
      color 140ms ease-out,
      border-color 140ms ease-out;
  }

  .affirmative:hover {
    border-color: var(--color-action);
    color: var(--color-action);
  }

  /* The negative: quiet, no border, no fill. It undoes; it does not act. */
  .negative {
    appearance: none;
    display: inline-flex;
    align-items: center;
    inline-size: fit-content;
    min-block-size: 44px;
    min-inline-size: 44px;
    padding-inline: 0;
    border: 0;
    background: transparent;
    font-family: var(--font-sans);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-ink-quiet);
    cursor: pointer;
    transition: color 140ms ease-out;
  }

  .negative:hover {
    color: var(--color-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .review {
      animation: none;
    }

    .affirmative,
    .negative {
      transition: none;
    }
  }
</style>
